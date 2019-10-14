class AvailableJobsView {

    constructor(parentElement, updater, onHire) {
        this.parentElement = parentElement;
        this.updater = updater;
        this.onHire = onHire;
        this.availableViews = [];
    }

    create() {
        this.headerElement = document.createElement("h2");
        this.headerElement.textContent = "Available Jobs";
        this.parentElement.appendChild(this.headerElement);

        this.refreshContainer = document.createElement("div");
        this.refreshContainer.id = "available-jobs-refresh-container";
        this.parentElement.appendChild(this.refreshContainer);

        this.refreshCooldownView = new TimeRemainingView("available-jobs-refresh", "Refresh in", this.refreshContainer, () => this.updater().refreshTimer);
        this.refreshCooldownView.create();

        const onRefresh = () => {
            const available = this.updater();
            available.onRefresh();
            this.update(true);
        }
        this.refreshButton = new Button("Refresh", this.refreshContainer, onRefresh);
        this.refreshButton.create();
        this.refreshButton.buttonDiv.classList.add("available-jobs-refresh-component");

        this.containerElement = document.createElement("div");
        this.containerElement.id = "available-jobs-container";
        this.parentElement.appendChild(this.containerElement);
    }

    update(refresh = false) {
        const available = this.updater();
        this.headerElement.textContent = `Available Jobs (Max level: ${available.maxLevel})`;

        if (refresh) {
            this.availableViews = [];

            while (this.containerElement.firstChild) {
                this.containerElement.removeChild(this.containerElement.firstChild);
            }

            available.jobs.forEach((job, i) => {
                const onAccept = () => {
                    available.jobs.splice(i, 1);
                    this.update(true);
                    this.onHire(job);
                }
                const availableJobView = new AvailableJobView(this.containerElement, () => job, onAccept);
                availableJobView.create(i);
                this.availableViews.push(availableJobView);
            });
        }

        this.refreshCooldownView.update();

        if (available.refreshTimer == 0) {
            this.refreshCooldownView.element.style.display = "none";
            this.refreshButton.buttonDiv.style.display = "inline-block";
        }
        else {
            this.refreshCooldownView.element.style.display = "inline-block";
            this.refreshButton.buttonDiv.style.display = "none";
        }

        this.availableViews.forEach(view => view.update());
    }
}

class AvailableJobView {

    constructor(parentElement, updater, onAccept) {
        this.parentElement = parentElement;
        this.updater = updater;
        this.onAccept = onAccept;
    }

    create(index = 0) {
        this.containerElement = document.createElement("div");
        this.containerElement.className = "available-job-view";
        this.parentElement.appendChild(this.containerElement);

        this.nameElement = document.createElement("p");
        this.nameElement.className = "available-job-name-view";
        this.containerElement.appendChild(this.nameElement);

        this.wageElement = new NumericView(`available-job-wage-${index}`, "Wage", this.containerElement, () => this.updater().wage, true);
        this.wageElement.create();

        this.costsElement = new NumericView(`available-job-costs-${index}`, "Costs", this.containerElement, () => this.updater().costs, true);
        this.costsElement.create();

        this.stressElement = new NumericView(`available-job-stress-${index}`, "Stress", this.containerElement, () => this.updater().stress, true);
        this.stressElement.create();

        this.acceptButton = new Button("Accept", this.containerElement, this.onAccept);
        this.acceptButton.create();
    }

    update() {
        const job = this.updater();

        this.nameElement.textContent = job.name;
        this.wageElement.update();
        this.costsElement.update();
        this.stressElement.update();
    }
}
