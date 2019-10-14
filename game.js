class Game {

    // --- INIT LOGIC ---

    constructor() {
        // TODO: Figure out better state version handling
        const VERSION = 3;
        this.state = {};
        this.state.version = VERSION;
        this.state.capital = 0;
        this.state.hour = 0;
        this.state.day = 0;
        this.state.year = 0;
        this.state.age = 18;
        this.state.wageFactor = 1.0;
        this.state.baseCosts = 0.01;
        this.state.costsFactor = 1.0;
        this.state.baseStress = 1.0;
        this.state.stressFactor = 1.0;

        const unemployed = new Job(
            "Unemployed",
            "You do nothing. The government pays for your basic subsistence.",
            0.0,
            0.0,
            1.0
        );

        this.state.job = unemployed;

        const onCareerUpgrade = () => {
            this.state.costsFactor *= 2.0;
            this.state.stressFactor *= 2.0;
        }
        const onCareerFinished = () => {
            this.state.costsFactor *= 0.5;
            this.state.stressFactor *= 0.5;
            this.state.availableJobs.maxLevel++;

            const isRefreshTimerTicking =
                this.state.availableJobs.refreshTimer < this.state.availableJobs.refreshCooldown &&
                this.state.availableJobs.refreshTimer > 0;
            if (isRefreshTimerTicking) {
                this.state.availableJobs.refreshTimer *= 0.5;
            }
            this.state.availableJobs.refreshCooldown *= 0.5;
        }

        const onNetworkUpgrade = (networking) => {
            onCareerUpgrade();
            this.state.capital -= networking.investment;
        };
        const onNetworkFinished = () => {
            onCareerFinished();
            this.state.baseStress += 0.01;
        };

        const onEducationUpgrade = () => {
            onCareerUpgrade();
            this.state.wageFactor *= 0.5;
        };
        const onEducationFinished = () => {
            onCareerFinished();
            this.state.wageFactor *= 2.0;
            this.state.baseCosts += 0.01;
        };

        this.state.career = new Career(onNetworkUpgrade, onNetworkFinished, onEducationUpgrade, onEducationFinished);

        this.state.availableJobs = new AvailableJobs();
        this.state.availableJobs.generate();

        this.views = [];
    }

    initViews() {
        const statsDiv = document.createElement("div");
        statsDiv.id = "stats-layout";
        document.body.appendChild(statsDiv);

        this.buildNumericView("capital", "Capital ($)", statsDiv, () => this.state.capital, true);
        this.buildNumericView("income", "Income ($)", statsDiv, () => this.getTotalIncome(), true);
        this.buildNumericView("hour", "Hour", statsDiv, () => this.state.hour);
        this.buildNumericView("day", "Day", statsDiv, () => this.state.day);
        this.buildNumericView("year", "Year", statsDiv, () => this.state.year);
        this.buildNumericView("age", "Age", statsDiv, () => this.state.age, true);
        this.buildNumericView("expenses", "Expenses ($)", statsDiv, () => this.getTotalCosts(), true);
        this.buildNumericView("stress", "Stress", statsDiv, () => this.getTotalStress(), true);

        const jobDiv = document.createElement("div");
        jobDiv.id = "job-layout";
        document.body.appendChild(jobDiv);

        this.buildJobView(jobDiv, () => this.state.job);

        this.careerDiv = document.createElement("div");
        this.careerDiv.id = "career-layout";
        document.body.appendChild(this.careerDiv);

        this.buildCareerView(this.careerDiv, () => this.state.career);

        const availableDiv = document.createElement("div");
        availableDiv.id = "available-jobs-layout";
        document.body.appendChild(availableDiv);

        this.buildAvailableJobsview(availableDiv, () => this.state.availableJobs);
    }

    buildNumericView(name, label, parentElement, updater, isDecimal = false) {
        const view = new NumericView(name, label, parentElement, updater, isDecimal);
        view.create();
        this.views.push(view);
    }

    buildJobView(parentElement, updater) {
        const view = new JobView(parentElement, updater);
        view.create();
        this.views.push(view);
    }

    buildCareerView(parentElement, updater) {
        const view = new CareerView(parentElement, updater);
        view.create();
        this.views.push(view);
    }

    buildAvailableJobsview(parentElement, updater) {
        const onHire = job => this.state.job = job;
        const view = new AvailableJobsView(parentElement, updater, onHire);
        view.create();
        view.update(true);
        this.views.push(view);
    }

    // --- GAME LOGIC ---

    mainLoop() {
        // UPDATE
        this.updateCapital();
        this.updateTime();
        this.state.career.finishCompletedUpgrades();

        // RENDER
        if (this.state.job.name == "Unemployed") {
            this.careerDiv.style.display = "none";
        }
        else {
            this.careerDiv.style.display = "inline";
        }
        this.views.forEach(view => view.update());

        // SAVE
        localStorage.setItem("state", JSON.stringify(this.state));
    }

    getTotalIncome() {
        return (this.state.wageFactor * this.state.job.wage) - this.getTotalCosts();
    }

    getTotalCosts() {
        return this.state.costsFactor * (this.state.baseCosts + this.state.job.costs);
    }

    getTotalStress() {
        return this.state.stressFactor * this.state.baseStress * this.state.job.stress;
    }

    updateCapital() {
        this.state.capital += this.state.wageFactor * this.state.job.wage;
        this.state.capital -= this.getTotalCosts();
    }

    updateTime() {
        if (this.state.hour < 23) {
            this.state.hour++;
        }
        else {
            this.state.hour = 0;
            this.state.day++;
        }

        if (this.state.day > 364) {
            this.state.day = 0;
            this.state.year++;
        }

        this.state.age += this.getTotalStress() / (365 * 24);

        function decrementOrZero(timer) {
            if (timer <= 1.0) {
                timer = 0;
            }
            else {
                timer--;
            }

            return timer;
        }

        this.state.availableJobs.refreshTimer = decrementOrZero(this.state.availableJobs.refreshTimer);
        this.state.career.networking.upgradeTimer = decrementOrZero(this.state.career.networking.upgradeTimer);
        this.state.career.education.upgradeTimer = decrementOrZero(this.state.career.education.upgradeTimer);

        /*if (this.state.availableJobs.refreshTimer > 0) {
            this.state.availableJobs.refreshTimer--;
        }

        if (this.state.career.networking.upgradeTimer > 0) {
            this.state.career.networking.upgradeTimer--;
        }
        if (this.state.career.education.upgradeTimer > 0) {
            this.state.career.education.upgradeTimer--;
        }*/
    }

    // --- ENTRY POINT ---

    run() {
        const savedState = JSON.parse(localStorage.getItem("state"));
        if (savedState && savedState.version == this.state.version) {
            this.loadSavedState(savedState);
        }

        this.initViews();

        setInterval(() => this.mainLoop(), 1000);
    }

    loadSavedState(saved) {
        this.state.capital = saved.capital;
        this.state.hour = saved.hour;
        this.state.day = saved.day;
        this.state.year = saved.year;
        this.state.age = saved.age;
        this.state.wageFactor = saved.wageFactor;
        this.state.baseCosts = saved.baseCosts;
        this.state.costsFactor = saved.costsFactor;
        this.state.baseStress = saved.baseStress;
        this.state.stressFactor = saved.stressFactor;

        this.state.job = saved.job;

        this.state.career.networking.level = saved.career.networking.level;
        this.state.career.networking.duration = saved.career.networking.duration;
        this.state.career.networking.upgradeTimer = saved.career.networking.upgradeTimer;
        this.state.career.networking.upgradeStarted = saved.career.networking.upgradeStarted;
        this.state.career.networking.investment = saved.career.networking.investment;

        this.state.career.education.level = saved.career.education.level;
        this.state.career.education.duration = saved.career.education.duration;
        this.state.career.education.upgradeTimer = saved.career.education.upgradeTimer;
        this.state.career.education.upgradeStarted = saved.career.education.upgradeStarted;

        this.state.availableJobs.maxLevel = saved.availableJobs.maxLevel;
        this.state.availableJobs.jobs = saved.availableJobs.jobs;
        this.state.availableJobs.refreshCooldown = saved.availableJobs.refreshCooldown;
        this.state.availableJobs.refreshTimer = saved.availableJobs.refreshTimer;
    }
}

window.onload = () => {
    const game = new Game();

    // Put in global scope for debug purposes
    // TODO: Figure out if there is a better way to achieve this
    window.game = game;

    game.run()
}
