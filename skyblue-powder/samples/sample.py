import os
from dataclasses import dataclass, field
from typing import Optional, List
from enum import Enum

# Constants
DATABASE_URL = "postgresql://localhost:5432/mydb"
MAX_CONNECTIONS = 10


class Priority(Enum):
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4


@dataclass
class Task:
    """Represents a single task in the system."""

    title: str
    description: str = ""
    priority: Priority = Priority.MEDIUM
    completed: bool = False
    tags: List[str] = field(default_factory=list)

    def mark_done(self) -> None:
        self.completed = True

    @property
    def is_urgent(self) -> bool:
        return self.priority in (Priority.HIGH, Priority.CRITICAL)

    def __repr__(self) -> str:
        status = "done" if self.completed else "pending"
        return f"Task({self.title!r}, {status}, {self.priority.name})"


class TaskManager:
    """Manages a collection of tasks with filtering and stats."""

    def __init__(self, owner: str):
        self._tasks: List[Task] = []
        self.owner = owner

    def add(self, title: str, priority: Priority = Priority.MEDIUM, **kwargs) -> Task:
        task = Task(title=title, priority=priority, **kwargs)
        self._tasks.append(task)
        return task

    def find_by_tag(self, tag: str) -> List[Task]:
        return [t for t in self._tasks if tag in t.tags]

    def pending(self) -> List[Task]:
        return [t for t in self._tasks if not t.completed]

    @property
    def stats(self) -> dict:
        total = len(self._tasks)
        done = sum(1 for t in self._tasks if t.completed)
        return {
            "total": total,
            "done": done,
            "pending": total - done,
            "completion_rate": round(done / total * 100, 1) if total else 0.0,
        }


def main():
    manager = TaskManager(owner="Alice")

    # Add some tasks
    manager.add("Set up CI/CD", Priority.HIGH, tags=["devops", "infra"])
    manager.add("Write unit tests", Priority.MEDIUM, tags=["testing"])
    manager.add("Fix login bug", Priority.CRITICAL, tags=["bugfix", "auth"])
    manager.add("Update README", Priority.LOW, tags=["docs"])

    # Work through tasks
    urgent = [t for t in manager.pending() if t.is_urgent]
    for task in urgent:
        print(f"Working on: {task}")
        task.mark_done()

    # Check results
    print(f"\nStats for {manager.owner}:")
    for key, value in manager.stats.items():
        print(f"  {key}: {value}")

    # Dictionary comprehension and walrus operator
    env_vars = {k: v for k, v in os.environ.items() if k.startswith("PATH")}

    if (db_url := os.environ.get("DATABASE_URL")) is not None:
        print(f"Using database: {db_url}")
    else:
        print(f"Defaulting to: {DATABASE_URL}")

    # Try/except
    try:
        result = 100 / len(urgent)
    except ZeroDivisionError:
        result = float("inf")
    finally:
        print(f"Result: {result}")


if __name__ == "__main__":
    main()
