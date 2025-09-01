from . import db
from flask_login import UserMixin
from sqlalchemy.sql import func
from sqlalchemy.ext.hybrid import hybrid_property


class User(db.Model, UserMixin):
    name = db.Column(db.String(150), nullable=False, unique=True)
    id = db.Column(db.Integer, primary_key=True)
    tasks = db.relationship("Task", backref="user", lazy=True)

    @hybrid_property
    def number_of_tasks(self):
        return len(self.tasks)


class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.String(200), nullable=False)
    priority = db.Column(db.String(20), default="Medium")  # Low, Medium, High
    completed = db.Column(db.Boolean, default=False)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
