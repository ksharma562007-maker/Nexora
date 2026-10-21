import re

# Comprehensive clean transcription of all 26 pages of Operating System Unit 1
OS_UNIT_1_CURATED_TEXT = """# Operating System - Unit 1 Lecture Notes

### Page 1: Introduction to Operating System
- **Definition:** An Operating System (OS) is fundamental system software that acts as an intermediary interface between computer hardware and the user during program execution.
- **Key Roles:** Controls and coordinates the use of hardware among various system resources and application programs. Acts as a resource allocator and scheduler for tasks.
- **Communication Flow:** User <-> Application Software <-> Operating System <-> Device Drivers <-> Computer Hardware.
- **Device Drivers:** Specialized software that enables the OS to communicate directly with hardware devices.

### Page 2: Functions of Operating System & Task Scheduling
- **Core Functions of OS:**
  1. **Task Scheduling:** Decides which process gets the CPU and allocates CPU execution time among competing programs (multitasking).
  2. **Process Creation & Deletion:** The OS creates processes, schedules CPU time, executes processes, and reclaims allocated resources when completed (e.g., listening to music while using Chrome and MS Word).

### Page 3: File Management & Virtual Memory
- **File Management:** The OS manages all files and directories. Creates a structured hierarchical tree directory structure (folders and sub-folders). Controls file access permissions (read, write, execute) and navigation (move, delete).
- **Memory Management:** The OS manages the computer's Main Memory (RAM). Allocates memory blocks during program execution and prevents memory wastage.
- **Virtual Memory:** A secondary memory storage technique used when physical RAM is insufficient. Moves inactive data temporarily to a reserved paging space on disk and swaps it back to RAM when needed.

### Page 4: Device Management & Memory Hierarchy
- **Device Management:** Controls input/output devices, access security, password authentication, unauthorized accounts prevention, and file permission protection.
- **Memory Hierarchy (Speed, Cost, and Capacity):**
  1. **Registers:** Located inside the CPU. Smallest storage capacity (in bytes/KB), highest cost, but fastest access speed.
  2. **Cache Memory:** Located on or near the processor. Very fast and high-cost storage holding frequently used instructions and data.
  3. **Main Memory (RAM):** Direct volatile working memory for active programs.
  4. **Secondary Storage (HDD / SSD):** Non-volatile, high capacity, slower access speed.

### Page 5: Registers, Cache Memory & RAM
- **Registers:** Store temporary data and instructions directly accessed by the CPU at clock speed. Highest cost per bit.
- **Cache Memory:** Bridges the speed gap between CPU and Main Memory. Stores frequently accessed instructions so the CPU can execute instructions without memory latency bottlenecks.
- **Random Access Memory (RAM):**
  - **SRAM (Static RAM):** Faster, more expensive, used for Cache memory.
  - **DRAM (Dynamic RAM):** Slower, cheaper, requires periodic electrical refreshing, used as primary Main Memory.

### Page 6: ROM (Read-Only Memory) & Secondary Storage
- **Read-Only Memory (ROM):** Non-volatile permanent memory containing firmware and bootstrap instructions.
  - **PROM:** Programmable ROM (written once).
  - **EPROM:** Erasable Programmable ROM (erased using UV light).
  - **EEPROM:** Electrically Erasable Programmable ROM (erased electronically).
  - **Mask ROM:** Hardwired during chip manufacture.
- **Secondary Memory:** Non-volatile, large capacity permanent storage (HDD, Solid State Drive SSD, Flash / Pen Drive, Optical CD/DVD).
- **CPU Components:** Arithmetic Logic Unit (ALU) performs math and logic operations; Control Unit (CU) coordinates all computer operations.

### Page 7: CPU Organization & Single-User Operating Systems
- **CPU Registers & Execution:** The ALU and registers directly communicate with Main Memory (RAM) during execution.
- **Single-User Operating System:** Dedicated to a single user at a given time. All system resources are allocated to one user.
- **Advantages:** Simple to design, optimized individual performance.
- **Disadvantages:** Resource sharing is limited.

### Page 8: Single-User vs Multi-User Operating Systems
- **Single-User OS:** Designed for one user interaction (Modern Windows desktop is a single-user OS supporting multitasking).
- **Multi-User OS:** Allows multiple users to access computer system resources simultaneously. Each user has a separate secure account.
- **Advantages:** Efficient resource utilization, centralized security, cost-effective sharing, supports remote network logins.

### Page 9: Batch Operating Systems & Real-Time OS Intro
- **Batch Operating System:** Similar jobs requiring common processing are grouped into batches without user interaction and processed sequentially by the CPU.
  - **Advantages:** Reduces CPU idle time for repetitive bulk workloads.
  - **Disadvantages:** High turnaround time, difficult to debug interactive programs.
- **Real-Time Operating System (RTOS):** Guarantees strict response within specified time deadlines where timing is mission-critical.

### Page 10: Hard RTOS vs Soft RTOS & Distributed Systems
- **Hard RTOS:** Missing a deadline is strictly unacceptable and leads to catastrophic system failure (e.g., aircraft flight control, missile guidance, nuclear power plants).
- **Soft RTOS:** Minor deadline delays are acceptable; performance degrades gracefully but the system remains operational (e.g., video streaming, audio playback).
- **Distributed Operating System:** Coordinates a collection of independent networked computers appearing to users as a single coherent system. Shares compute loads and provides fault tolerance.

### Page 11: Network Operating Systems & Multiprogramming
- **Network OS:** Runs on servers and enables multiple computers to communicate, share files, and manage centralized administrative security.
- **Multiprogramming:** Keeps multiple programs concurrently in Main Memory (RAM). When one program waits for an I/O operation, the CPU immediately switches to execute another program, maximizing CPU utilization and eliminating idle time.

### Page 12: Process Lifecycle & Process States (New, Ready, Running)
- **Process Definition:** A program in active execution loaded into Main Memory.
- **Process State Lifecycle:**
  1. **New State:** The process is created and submitted; awaiting admission into memory.
  2. **Ready State:** The process is loaded into Main Memory (RAM) and waiting in the Ready Queue for CPU allocation.
  3. **Running State:** Instructions are actively being executed by the CPU.

### Page 13: Process States (Waiting, Terminated) & Schedulers
- **4. Waiting (Blocked) State:** Process transitions here when waiting for an I/O operation (keyboard input, disk read, printer). Returns to Ready state upon I/O completion.
- **5. Terminated State:** Process finishes execution and resources are deallocated by the OS.
- **Scheduler:** OS component that selects which process from memory should be executed by the CPU next.

### Page 14: Long-Term Scheduler (Job Scheduler) & Short-Term Scheduler
- **Long-Term Scheduler (LTS / Job Scheduler):** Selects processes from secondary storage (Job Pool) and loads them into Main Memory (Ready Queue). Controls the degree of multiprogramming.
- **Short-Term Scheduler (STS / CPU Scheduler):** Selects a process from the Ready Queue and allocates the CPU for immediate execution. Operates with high frequency.

### Page 15: Multitasking & Time Quantum (Time Slice)
- **Multitasking:** Extension of multiprogramming. The CPU switches rapidly between processes using a fixed Time Quantum (Time Slice). Creates the illusion that all programs run concurrently.
- **Time Quantum:** The fixed amount of CPU time allotted to each process before a context switch occurs.
- **Context Switch:** Saving the state of the active process and restoring the state of the next ready process.

### Page 16: Short-Term Scheduler (CPU Scheduler) & Dispatcher
- **Short-Term Scheduler (STS):** Evaluates scheduling algorithms to decide which ready process should receive the CPU.
- **Dispatcher:** The system software module that actually performs the context switch: gives CPU control to the selected process, switches user mode, and jumps to the proper instruction restart location.

### Page 17: Medium-Term Scheduler & Swapping (Swap-In / Swap-Out)
- **Medium-Term Scheduler (MTS):** Manages process swapping between Main Memory (RAM) and Secondary Storage (Hard Disk) to reduce the degree of multiprogramming when memory is overcommitted.
- **Swapping:**
  - **Swap-Out:** Moves a suspended or blocked process from RAM to disk.
  - **Swap-In:** Brings the process back into RAM when memory becomes available.

### Page 18: Context Switching & CPU Scheduling Fundamentals (AT, BT)
- **Context Switching Overhead:** Involves saving register values, program counter, and stack pointers. Consumes CPU cycles without performing useful user computation.
- **CPU Scheduling Criteria & Timing Metrics:**
  - **Arrival Time (AT):** Time at which a process enters the Ready Queue.
  - **Burst Time (BT):** Total CPU execution time required by the process.
  - **Completion Time (CT):** Exact time at which a process finishes execution.

### Page 19: First-Come First-Served (FCFS) Scheduling & Formulas
- **Algorithm: First-Come First-Served (FCFS):**
  - **Principle:** The process that arrives first in the Ready Queue is allocated the CPU first. Operates strictly on FIFO (First-In, First-Out) queuing.
  - **Mode:** Non-preemptive in nature. Once the CPU is allocated to a process, it cannot be interrupted or taken away until execution completes.
  - **Formulas:**
    - **Turnaround Time (TAT):** Total time from arrival to completion. `TAT = CT - AT` (Completion Time - Arrival Time).
    - **Waiting Time (WT):** Total time spent waiting in the ready queue. `WT = TAT - BT` (Turnaround Time - Burst Time).
  - **Advantages:** Extremely simple and easy to understand and program.
  - **Disadvantages:** Suffer from the **Convoy Effect** (short processes stuck waiting behind a massive burst time process) leading to high average waiting times and starvation.

### Page 20: Shortest Job First (SJF) Scheduling
- **Algorithm: Shortest Job First (SJF):**
  - **Principle:** Selects the process with the smallest Burst Time (CPU execution time) from the Ready Queue.
  - **Mode:** Non-preemptive.
  - **Advantages:** Minimizes the average waiting time among all non-preemptive scheduling algorithms.
  - **Disadvantages:** CPU Burst Time must be predicted or known in advance; long burst processes may suffer from starvation.

### Page 21: Shortest Remaining Time First (SRTF) Scheduling
- **Algorithm: Shortest Remaining Time First (SRTF):**
  - **Principle:** Preemptive version of Shortest Job First (SJF).
  - **Mode:** Preemptive. If a newly arrived process has a remaining burst time shorter than the currently running process, the CPU is preempted and reassigned to the shorter process.
  - **Advantages:** Provides superior response times and lower average waiting times.
  - **Disadvantages:** Frequent context switching increases system overhead.

### Page 22: Round Robin (RR) Scheduling & Time Quantum
- **Algorithm: Round Robin (RR):**
  - **Principle:** Designed specifically for interactive time-sharing systems. Processes in the circular Ready Queue are each allocated the CPU for a fixed slice of time called the **Time Quantum**.
  - **Mode:** Preemptive. If a process does not finish within its time quantum, it is preempted and moved to the back of the Ready Queue.
  - **Fairness:** Every process receives an equal and fair share of CPU time without starvation.

### Page 23: Priority Scheduling (Preemptive & Non-Preemptive)
- **Algorithm: Priority Scheduling:**
  - **Principle:** Each process is assigned an integer priority rank (higher rank executes first).
  - **Modes:** Can be configured as Non-preemptive or Preemptive (where a higher priority arrival immediately preempts the running process).
  - **Disadvantages:** Low-priority processes may suffer from starvation (indefinite blocking).
  - **Solution (Aging):** Gradually increasing the priority of processes that wait in the system for a long time.

### Page 24: Multilevel Queue Scheduling (MLQ)
- **Algorithm: Multilevel Queue Scheduling (MLQ):**
  - **Structure:** Ready Queue is partitioned into multiple separate priority queues (e.g., System Processes, Interactive Foreground Processes, Batch Background Processes).
  - **Behavior:** Each queue has its own scheduling algorithm (e.g., Round Robin for foreground, FCFS for background). Processes are permanently assigned to one queue.
  - **Limitation:** Low-priority queues may starve if high-priority queues are continuously populated.

### Page 25: Multilevel Feedback Queue Scheduling (MLFQ) - Part 1
- **Algorithm: Multilevel Feedback Queue (MLFQ):**
  - **Concept:** More flexible extension of Multilevel Queue. Allows processes to dynamically move between queues based on their past CPU burst behavior.
  - **Operation:** I/O-bound and interactive processes move to higher-priority queues; CPU-bound processes requiring long compute times are degraded to lower-priority queues.

### Page 26: Multilevel Feedback Queue Scheduling (MLFQ) - Part 2
- **Feedback Mechanism:** Prevents starvation by implementing **Aging**: if a process waits too long in a lower-priority queue, the scheduler boosts its priority to a higher queue.
- **Conclusion:** MLFQ represents the most comprehensive, versatile, and adaptive CPU scheduling algorithm in modern operating systems.
"""
