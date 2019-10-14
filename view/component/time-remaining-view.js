class TimeRemainingView {

    constructor(name, label, parentElement, updater) {
        this.name = name;
        this.label = label;
        this.parentElement = parentElement;
        this.updater = updater;
    }

    create() {
        this.element = document.createElement("p");
        this.element.id = `${this.name}-view`;
        this.element.className = `${this.name}-component`;
        this.parentElement.appendChild(this.element);
    }

    update() {
        const val = this.updater();
        this.element.textContent = `${this.label}: ${Math.floor(val / 24)}d ${Math.floor(val % 24)}h`;
    }
}
