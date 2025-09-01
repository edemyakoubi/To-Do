from flask import Blueprint, render_template, request, flash, redirect, url_for
from .models import User
from . import db
from flask_login import login_user, login_required, logout_user, current_user


auth = Blueprint("auth", __name__)


@auth.route("/", methods=["GET", "POST"])
def welcome():
    if request.method == "POST":
        name = request.form.get("name")
        action = request.form.get("action")  # "login" or "create"

        if not name:
            flash("Don't be shy, say your name", category="error")
            return redirect(url_for("auth.welcome"))

        user = User.query.filter_by(name=name).first()

        if action == "login":
            if user:
                login_user(user)
                flash(f"Have a productive time, {name}", category="success")
                return redirect(url_for("views.home"))
            else:
                flash(
                    "I don't recognize your name. Try again or create a new user.",
                    category="error",
                )
                return redirect(url_for("auth.welcome"))

        elif action == "create":
            if user:
                flash(
                    "That name already exists! Try logging in instead.",
                    category="error",
                )
                return redirect(url_for("auth.welcome"))

            new_user = User(name=name)
            db.session.add(new_user)
            db.session.commit()
            login_user(new_user)
            flash(f"Welcome {name}!", category="success")
            return redirect(url_for("views.home"))

    return render_template("welcome.html")


@auth.route("/logout")
@login_required
def logout():
    logout_user()
    flash("See You next Time!", category="success")
    return redirect(url_for("auth.welcome"))
