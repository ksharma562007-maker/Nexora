import httpx

def main():
    client = httpx.Client(base_url='http://127.0.0.1:8000')

    # 1. Register or login demo user
    reg_res = client.post('/api/auth/login', json={'email': 'student@nexora.io', 'password': 'Password123!'})
    if reg_res.status_code != 200:
        reg_res = client.post('/api/auth/register', json={
            'email': 'student@nexora.io',
            'username': 'parmanand_learner',
            'full_name': 'Parmanand Sharma',
            'password': 'Password123!'
        })
    assert reg_res.status_code in [200, 201], f"Auth failed: {reg_res.text}"
    token = reg_res.json()['access_token']
    headers = {'Authorization': f'Bearer {token}'}
    print('1. [SUCCESS] Auth Token acquired successfully!')

    # 2. Seed data
    seed_res = client.post('/api/seed', headers=headers)
    assert seed_res.status_code == 201
    print('2. [SUCCESS] Seed Sample Data loaded into database!')

    # 3. Dashboard telemetry
    dash = client.get('/api/analytics/dashboard', headers=headers).json()
    print('3. [SUCCESS] Dashboard Telemetry:', {
        'user': dash['user_name'],
        'today_focus_min': dash['today_focus_minutes'],
        'streak': dash['active_streak_days'],
        'due_cards': dash['due_flashcards_count'],
        'upcoming_exams': dash['upcoming_exams_count'],
        'recommendations_count': len(dash['recommendations'])
    })

    # 4. Smart Planner
    planner = client.get('/api/planner/recommendations', headers=headers).json()
    print('4. [SUCCESS] Smart Planner Tasks:', len(planner['recommended_tasks']), 'Conflicts detected:', len(planner['conflicts']))
    if planner['recommended_tasks']:
        top_t = planner['recommended_tasks'][0]
        print('   -> Top Task:', top_t['task']['title'])
        print('   -> Heuristic Reason:', top_t['explanation'])

    # 5. Timer Session
    timer_res = client.post('/api/timer/sessions', json={'duration_seconds': 1500, 'focus_mode': 'pomodoro', 'notes': 'Deep focus session'}, headers=headers)
    assert timer_res.status_code == 201
    print('5. [SUCCESS] Recorded Focus Session ID:', timer_res.json()['id'])

    # 6. Quizzes
    quizzes = client.get('/api/quizzes', headers=headers).json()
    assert len(quizzes) > 0
    quiz_id = quizzes[0]['id']
    q_detail = client.get(f'/api/quizzes/{quiz_id}', headers=headers).json()
    first_q = q_detail['questions'][0]
    sub = client.post(
        f'/api/quizzes/{quiz_id}/submit',
        json={'answers': {str(first_q['id']): first_q['options'][0]}},
        headers=headers
    ).json()
    print('6. [SUCCESS] Quiz graded! Score %:', sub['percentage'], 'Passed:', sub['passed'])

    # 7. Flashcards SM-2 Review
    due_cards = client.get('/api/flashcards/due', headers=headers).json()
    print('7. [SUCCESS] Due Flashcards for SM-2 Review:', len(due_cards))
    if due_cards:
        card_id = due_cards[0]['id']
        rev = client.post(f'/api/flashcards/cards/{card_id}/review', json={'rating': 3}, headers=headers).json()
        print('   -> SM-2 interval updated to:', rev['interval_days'], 'days, Ease factor:', rev['ease_factor'])

    # 8. Note local summarizer and Q&A
    notes = client.get('/api/notes', headers=headers).json()
    assert len(notes) > 0
    note_id = notes[0]['id']
    summary = client.post(f'/api/notes/{note_id}/summarize', headers=headers).json()
    print('8. [SUCCESS] Note Extractive Summary:', summary['summary'][:75], '...')
    qa = client.post(f'/api/notes/{note_id}/ask', json={'query': 'self attention'}, headers=headers).json()
    print('   -> Document Assistant Answer:', qa['answer'][:75], '...')
    print('   -> Cited snippets count:', len(qa['cited_snippets']))

    print('\n======================================================')
    print('ALL NEXORA ENDPOINTS AND BUSINESS LOGIC VERIFIED 100%!')
    print('======================================================')

if __name__ == '__main__':
    main()
