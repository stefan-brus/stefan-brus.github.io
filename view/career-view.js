class CareerView {

    constructor(parentElement, updater) {
        this.parentElement = parentElement;
        this.updater = updater;
    }

    create() {
        this.headerElement = document.createElement("h2");
        this.headerElement.textContent = "Career";
        this.parentElement.appendChild(this.headerElement);

        const descElement = document.createElement("p");
        descElement.textContent = "Each upgrade doubles costs & stress for its duration";
        this.parentElement.appendChild(descElement);

        const networkingDiv = document.createElement("div");
        networkingDiv.className = "career-component";
        this.parentElement.appendChild(networkingDiv);

        this.networkingView = new NetworkingView(networkingDiv, () => this.updater().networking);
        this.networkingView.create();

        const educationDiv = document.createElement("div");
        educationDiv.className = "career-component";
        this.parentElement.appendChild(educationDiv);

        this.educationView = new EducationView(educationDiv, () => this.updater().education);
        this.educationView.create();
    }

    update() {
        this.networkingView.update();
        this.educationView.update();
    }
}

class NetworkingView {

    constructor(parentElement, updater) {
        this.parentElement = parentElement;
        this.updater = updater;
    }

    create() {
        this.headerElement = document.createElement("p");
        this.headerElement.className = "career-name-view";
        this.parentElement.appendChild(this.headerElement);

        this.costView = new NumericView("career-networking-cost", "One-time investment ($)", this.parentElement, () => this.updater().investment, true);
        this.costView.create();

        const penaltyElement = document.createElement("p");
        penaltyElement.textContent = "Increases base stress";
        this.parentElement.appendChild(penaltyElement);

        this.timeRemainingView = new TimeRemainingView("career-networking-refresh", "Remaining", this.parentElement, () => this.updater().upgradeTimer);
        this.timeRemainingView.create();

        const onUpgrade = () => this.updater().upgrade();
        this.upgradeButton = new Button("Upgrade", this.parentElement, onUpgrade);
        this.upgradeButton.create();
    }

    update() {
        const networking = this.updater();

        this.headerElement.textContent = `Networking level ${networking.level}`;

        this.costView.update();

        this.timeRemainingView.update();

        if (networking.upgradeTimer == 0) {
            this.timeRemainingView.element.style.display = "none";
            this.upgradeButton.buttonDiv.style.display = "inline";
        }
        else {
            this.timeRemainingView.element.style.display = "inline";
            this.upgradeButton.buttonDiv.style.display = "none";
        }
    }
}

class EducationView {

    constructor(parentElement, updater) {
        this.parentElement = parentElement;
        this.updater = updater;
    }

    create() {
        this.headerElement = document.createElement("p");
        this.headerElement.className = "career-name-view";
        this.parentElement.appendChild(this.headerElement);

        const descElement = document.createElement("p");
        descElement.textContent = "Halves wage income for duration";
        this.parentElement.appendChild(descElement);

        const penaltyElement = document.createElement("p");
        penaltyElement.textContent = "Increases base expenses";
        this.parentElement.appendChild(penaltyElement);

        this.timeRemainingView = new TimeRemainingView("career-education-refresh", "Remaining", this.parentElement, () => this.updater().upgradeTimer);
        this.timeRemainingView.create();

        const onUpgrade = () => this.updater().upgrade();
        this.upgradeButton = new Button("Upgrade", this.parentElement, onUpgrade);
        this.upgradeButton.create();
    }

    update() {
        const education = this.updater();

        this.headerElement.textContent = `Education level ${education.level}`;

        this.timeRemainingView.update();

        if (education.upgradeTimer == 0) {
            this.timeRemainingView.element.style.display = "none";
            this.upgradeButton.buttonDiv.style.display = "inline";
        }
        else {
            this.timeRemainingView.element.style.display = "inline";
            this.upgradeButton.buttonDiv.style.display = "none";
        }
    }
}
