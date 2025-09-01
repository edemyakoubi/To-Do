from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_required, current_user
from .models import Task
from . import db

views = Blueprint("views", __name__)


@views.route("/home")
@login_required
def home():
    # Get tasks for the logged-in user only
    tasks = Task.query.filter_by(user_id=current_user.id).all()

    total_tasks = len(tasks)
    completed_tasks = sum(1 for t in tasks if t.completed)
    pending_tasks = total_tasks - completed_tasks

    # Completion rate
    completion_rate = (
        int((completed_tasks / total_tasks) * 100) if total_tasks > 0 else 0
    )

    # Count high priority tasks
    high_priority_count = sum(1 for t in tasks if t.priority == "High")

    # Latest task
    latest_task = tasks[-1].title if tasks else "No tasks yet"

    return render_template(
        "home.html",
        user=current_user,
        tasks=tasks,
        total_tasks=total_tasks,
        completed_tasks=completed_tasks,
        pending_tasks=pending_tasks,
        completion_rate=completion_rate,
        high_priority_count=high_priority_count,
        latest_task=latest_task,
    )


@views.route("/add-task", methods=["POST"])
@login_required
def add_task():
    title = request.form.get("title")
    priority = request.form.get("priority")

    if not title:
        flash("Task title cannot be empty.", category="error")
        return redirect(url_for("views.home"))

    new_task = Task(
        title=title, description="", priority=priority, user_id=current_user.id
    )

    db.session.add(new_task)
    db.session.commit()
    flash("Task added successfully!", category="success")

    return redirect(url_for("views.home"))


@views.route("/toggle-task/<int:task_id>", methods=["POST"])
@login_required
def toggle_task(task_id):
    task = Task.query.get_or_404(task_id)
    if task.user_id != current_user.id:
        flash("Not authorized", "error")
        return redirect(url_for("views.home"))
    task.completed = not task.completed
    db.session.commit()
    return redirect(url_for("views.home"))


@views.route("/delete-task/<int:task_id>", methods=["POST"])
@login_required
def delete_task(task_id):
    task = Task.query.get_or_404(task_id)
    if task.user_id != current_user.id:
        flash("Not authorized", "error")
        return redirect(url_for("views.home"))
    db.session.delete(task)
    db.session.commit()
    return redirect(url_for("views.home"))
