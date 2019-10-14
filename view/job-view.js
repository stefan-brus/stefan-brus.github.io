class JobView {

    constructor(parentElement, updater) {
        this.parentElement = parentElement;
        this.updater = updater;
        this.job = new Job("", "", 0.0, 0.0, 1.0);
    }

    create() {
        this.nameElement = document.createElement("p");
        this.nameElement.id = "job-name-view";
        this.parentElement.appendChild(this.nameElement);

        this.descriptionElement = document.createElement("p");
        this.parentElement.appendChild(this.descriptionElement);

        this.wageElement = new NumericView("job-wage", "Hourly wage ($)", this.parentElement, () => this.job.wage, true);
        this.wageElement.create();

        this.costsElement = new NumericView("job-costs", "Living costs ($)", this.parentElement, () => this.job.costs, true);
        this.costsElement.create();

        this.stressElement = new NumericView("job-stress", "Stress factor", this.parentElement, () => this.job.stress, true);
        this.stressElement.create();

    }

    update() {
        this.job = this.updater();

        this.nameElement.textContent = this.job.name;
        this.descriptionElement.textContent = this.job.description;
        this.wageElement.update();
        this.costsElement.update();
        this.stressElement.update();
    }
}
