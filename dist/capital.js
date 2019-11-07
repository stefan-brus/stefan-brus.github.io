class Game {

    // --- INIT LOGIC ---

    constructor() {
        this.state = {};
        this.state.version = VERSION;
        this.state.capital = 1.0;
        this.state.hour = 0;
        this.state.day = 0;
        this.state.year = 0;
        this.state.age = 18.0;
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

        this.state.loans = new Loans();

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

        this.state.passiveIncome = new PassiveIncome();

        this.views = [];
    }

    initViews() {
        this.gameContainer = document.createElement("div");
        document.body.appendChild(this.gameContainer);

        this.headerElement = document.createElement("h1");
        this.headerElement.textContent = "Capital";
        this.gameContainer.appendChild(this.headerElement);

        this.leftContainer = document.createElement("div");
        this.leftContainer.id = "left-container";
        this.gameContainer.appendChild(this.leftContainer);

        this.loansDiv = document.createElement("div");
        this.loansDiv.id = "loans-layout";
        this.leftContainer.appendChild(this.loansDiv);

        this.buildLoansView(this.loansDiv, () => this.state.loans);

        this.statsHeader = document.createElement("h2");
        this.statsHeader.textContent = "You";
        this.leftContainer.appendChild(this.statsHeader);

        const statsDiv = document.createElement("div");
        statsDiv.id = "stats-layout";
        this.leftContainer.appendChild(statsDiv);

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
        this.leftContainer.appendChild(jobDiv);

        this.buildJobView(jobDiv, () => this.state.job);

        this.careerDiv = document.createElement("div");
        this.careerDiv.id = "career-layout";
        this.leftContainer.appendChild(this.careerDiv);

        this.buildCareerView(this.careerDiv, () => this.state.career);

        const availableDiv = document.createElement("div");
        availableDiv.id = "available-jobs-layout";
        this.leftContainer.appendChild(availableDiv);

        this.buildAvailableJobsview(availableDiv, () => this.state.availableJobs);

        this.rightContainer = document.createElement("div");
        this.rightContainer.id = "right-container";
        this.gameContainer.appendChild(this.rightContainer);

        this.passiveIncomeDiv = document.createElement("div");
        this.passiveIncomeDiv.id = "passive-income-layout";
        this.rightContainer.appendChild(this.passiveIncomeDiv);

        this.buildPassiveIncomeView(this.passiveIncomeDiv, () => this.state.passiveIncome)
    }

    buildNumericView(name, label, parentElement, updater, isDecimal = false) {
        const view = new NumericView(name, label, parentElement, updater, isDecimal);
        view.create();
        this.views.push(view);
    }

    buildLoansView(parentElement, updater) {
        const onLoanRepaid = loan => this.state.capital -= loan.amount;
        const onLoanTaken = loan => this.state.capital += loan.amount;
        const view = new LoansView(parentElement, updater, onLoanRepaid, onLoanTaken);
        view.create();
        view.update(true);
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

    buildPassiveIncomeView(parentElement, updater) {
        const savingsAccountEvents = {
            onDeposit: amount => {
                if (amount > this.state.capital) {
                    return false;
                }

                this.state.capital -= amount;
                return true;
            },

            onWithdraw: amount => {
                this.state.capital += amount;
            }
        }
        const view = new PassiveIncomeView(parentElement, updater, savingsAccountEvents);
        view.create();
        view.update();
        this.views.push(view);
    }

    // --- GAME LOGIC ---

    mainLoop() {
        // UPDATE
        this.updateCapital();
        this.updateLoans();
        this.updatePassiveIncome();
        this.updateTime();
        this.state.career.finishCompletedUpgrades();

        // RENDER
        this.render();

        // SAVE
        localStorage.setItem("state", JSON.stringify(this.state));
    }

    render() {
        if (this.state.job.name == "Unemployed") {
            this.careerDiv.style.display = "none";
        }
        else {
            this.careerDiv.style.display = "inline";
        }

        this.views.forEach(view => view.update());
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

    updateLoans() {
        // Update loan base amount
        this.state.loans.baseAmount = this.getTotalCosts() * 10;

        // Repay existing loans daily
        if (this.state.hour == 23) {
            this.state.loans.loans.forEach(loan => {
                const payment = loan.amount * loan.interest;
                this.state.capital -= payment;
            });
        }

        // If capital is negative, take loans until positive
        while (this.state.capital < 0) {
            const loan = this.state.loans.takeLoan();
            this.state.capital += loan.amount;
        }
    }

    updatePassiveIncome() {
        if (this.state.hour == 23) {
            this.state.passiveIncome.onDailyUpdate();
        }
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

        this.state.loans.interestRate = saved.loans.interestRate;
        this.state.loans.baseAmount = saved.loans.baseAmount;
        this.state.loans.loans = saved.loans.loans;

        this.state.passiveIncome.savingsAccount.balance = saved.passiveIncome.savingsAccount.balance;
        this.state.passiveIncome.savingsAccount.interest = saved.passiveIncome.savingsAccount.interest;

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

    // Put in global scope for all kinds of purposes
    // Use this very carefully
    // TODO: Figure out if there is a better way to achieve this
    window.game = game;

    game.run()
}
class AvailableJobs {

    constructor() {
        this.maxLevel = 1;
        this.jobs = [];
        this.refreshCooldown = 24;
        this.refreshTimer = this.refreshCooldown;
    }

    generate() {
        this.jobs = [];
        for(let i = 0; i < Math.floor(Math.log2(this.maxLevel)) + 1; i++) {
            const jobLevel = Math.floor(Math.random() * this.maxLevel) + 1;
            this.jobs.push(generateJob(jobLevel));
        }
    }

    onRefresh() {
        this.refreshCooldown *= 2.0;
        this.refreshTimer = this.refreshCooldown;
        this.generate();
    }
}

/**
 * The algorithm for generating a new job:
 *
 * The generated job starts with 0.01 wage, 0.00 costs, 0.00 stress
 *
 * Each level gives 1 point, so a level 3 job has 3 points to spend.
 * An action is generated until all points are spent.
 * Each action can be positive or negative. A positive action costs 1 point, and a negative action gain 1 points.
 * Positive actions:
 * - Increase wage by 0.01
 * - Decrease costs by 0.01
 * - Decrease stress by 0.01
 * Negative actions:
 * - Decrease wage by 0.01 (note that wage cannot go below 0.01)
 * - Increase costs by 0.01 (costs cannot go below 0.01)
 * - Increase stress by 0.01
 */

function generateJob(level) {
    const job = new Job(`Level ${level}`, `A level ${level} job`, 1, 0, 100);
    let points = level;

    const actions = [

        // POSITIVE

        () => {
            job.wage += 1;
            return true;
        },
        () => {
            if (job.costs >= 1) {
                job.costs -= 1;
                return true;
            }
            else {
                points--;
                return false;
            }
        },
        () => {
            job.stress -= 1;
            return true;
        },

        // NEGATIVE

        () => {
            if (job.wage >= 2) {
                job.wage -= 1;
                return false;
            }
            else {
                points++;
                return true;
            }
        },
        () => {
            job.costs += 1;
            return false;
        },
        () => {
            job.stress += 1;
            return false;
        },
    ];

    while (points > 0) {
        const action = actions[Math.floor(Math.random() * actions.length)];
        if (action()) {
            points--;
        }
        else {
            points++;
        }
    }

    job.wage /= 100.0;
    job.costs /= 100.0;
    job.stress /= 100.0;

    return job;
}
class Career {

    constructor(onNetworkUpgrade, onNetworkFinished, onEducationUpgrade, onEducationFinished) {
        this.networking = new Networking(onNetworkUpgrade, onNetworkFinished);
        this.education = new Education(onEducationUpgrade, onEducationFinished);
    }

    finishCompletedUpgrades() {
        if (this.networking.upgradeStarted && this.networking.upgradeTimer == 0) {
            this.networking.onUpgradeFinished();
        }

        if (this.education.upgradeStarted && this.education.upgradeTimer == 0) {
            this.education.onUpgradeFinished();
        }
    }
}

class Networking {

    constructor(onNetworkUpgrade, onNetworkFinished) {
        this.onNetworkUpgrade = onNetworkUpgrade;
        this.onNetworkFinished = onNetworkFinished;
        this.level = 0;
        this.duration = 24;
        this.upgradeTimer = 0;
        this.upgradeStarted = false;
        this.investment = 1.0;
    }

    upgrade() {
        this.onNetworkUpgrade(this);
        this.upgradeStarted = true;
        this.upgradeTimer = this.duration;
    }

    onUpgradeFinished() {
        this.onNetworkFinished(this);
        this.investment *= 2.0;
        this.upgradeStarted = false;
        this.duration *= 2;
        this.level++;
    }
}

class Education {

    constructor(onEducationUpgrade, onEducationFinished) {
        this.onEducationUpgrade = onEducationUpgrade;
        this.onEducationFinished = onEducationFinished;
        this.level = 0;
        this.duration = 24;
        this.upgradeTimer = 0;
        this.upgradeStarted = false;
    }

    upgrade() {
        this.onEducationUpgrade(this);
        this.upgradeStarted = true;
        this.upgradeTimer = this.duration;
    }

    onUpgradeFinished() {
        this.onEducationFinished(this);
        this.upgradeStarted = false;
        this.duration *= 2;
        this.level++;
    }
}
class Job {

    constructor(name, description, wage, costs, stress) {
        this.name = name;
        this.description = description;
        this.wage = wage;
        this.costs = costs;
        this.stress = stress;
    }
}
class Loans {

    constructor() {
        this.interestRate = 0.01;
        this.baseAmount = 0;
        this.loans = [];
    }

    takeLoan() {
        const loan = new Loan(this.baseAmount, this.interestRate);
        this.loans.push(loan);
        this.interestRate += 0.01;
        return loan;
    }

    repayLoan(index) {
        this.loans.splice(index, 1);
        this.interestRate -= 0.01;
    }
}

class Loan {
    constructor(amount, interest) {
        this.amount = amount;
        this.interest = interest;
    }
}
class PassiveIncome {

    constructor() {
        this.savingsAccount = new SavingsAccount();
    }

    onDailyUpdate() {
        this.savingsAccount.onDailyUpdate();
    }
}

class SavingsAccount {

    constructor() {
        this.balance = 0.0;
        this.interest = 0.0001;
    }

    withdraw(desiredAmount) {
        const amountWithdrawn = desiredAmount > this.balance ? this.balance : desiredAmount;
        this.balance -= amountWithdrawn;
        return amountWithdrawn;
    }

    deposit(desiredAmount) {
        this.balance += desiredAmount;
    }

    onDailyUpdate() {
        this.balance += this.balance * this.interest;
    }
}
const VERSION = 7;
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
                    this.onHire(job);
                    this.update(true);
                }

                const onReject = () => {
                    available.jobs.splice(i, 1);
                    this.update(true);
                }

                const availableJobView = new AvailableJobView(this.containerElement, () => job, onAccept, onReject);
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

    constructor(parentElement, updater, onAccept, onReject) {
        this.parentElement = parentElement;
        this.updater = updater;
        this.onAccept = onAccept;
        this.onReject = onReject;
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

        this.rejectButton = new Button("Reject", this.containerElement, this.onReject);
        this.rejectButton.create();
    }

    update() {
        const job = this.updater();

        this.nameElement.textContent = job.name;
        this.wageElement.update();
        this.costsElement.update();
        this.stressElement.update();
    }
}
class CareerView {

    constructor(parentElement, updater) {
        this.parentElement = parentElement;
        this.updater = updater;
    }

    create() {
        this.headerElement = document.createElement("h2");
        this.headerElement.textContent = "Career";
        this.parentElement.appendChild(this.headerElement);

        this.descElement = new TextView("Each upgrade doubles stress & expenses for its duration", this.parentElement);
        this.descElement.create();

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

        this.penaltyElement = new TextView("Increases base stress", this.parentElement);
        this.penaltyElement.create();

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

        this.descElement = new TextView("Halves wage income for duration", this.parentElement);
        this.descElement.create();

        this.penaltyElement = new TextView("Increases base expenses", this.parentElement);
        this.penaltyElement.create();

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
class Button {

    constructor(label, parentElement, onClick) {
        this.label = label;
        this.parentElement = parentElement;
        this.onClick = () => {
            onClick();
            window.game.render();
        }
    }

    create() {
        this.buttonDiv = document.createElement("div");
        this.buttonDiv.className = "button";
        this.buttonDiv.textContent = this.label;
        this.buttonDiv.onclick = this.onClick;
        this.parentElement.appendChild(this.buttonDiv);
    }
}
class NumericView {

    constructor(name, label, parentElement, updater, isDecimal = false, numDecimals = 2) {
        this.name = name;
        this.label = label;
        this.parentElement = parentElement;
        this.updater = updater;
        this.isDecimal = isDecimal;
        this.numDecimals = numDecimals;
    }

    create() {
        const element = document.createElement("p");
        const labelText = document.createTextNode(`${this.label}: `);
        element.appendChild(labelText);
        this.viewElement = document.createElement("span");
        this.viewElement.id = `numeric-view-${this.name}`;
        const initVal = 0;
        this.viewElement.textContent = this.isDecimal ? initVal.toFixed(this.numDecimals) : initVal;
        element.appendChild(this.viewElement);
        this.parentElement.appendChild(element);
    }

    update() {
        const newVal = this.updater();
        this.viewElement.textContent = this.isDecimal ? newVal.toFixed(this.numDecimals) : newVal;
    }
}
class PercentView extends NumericView {

    constructor(name, label, parentElement, updater) {
        super(name, label, parentElement, updater, true, 2);
    }

    update() {
        const newVal = this.updater();
        this.viewElement.textContent = (newVal * 100.0).toFixed(this.numDecimals) + "%";
    }
}
class TextView {

    constructor(text, parentElement) {
        this.text = text;
        this.parentElement = parentElement;
    }

    create() {
        this.element = document.createElement("p");
        this.element.className = "text-view";
        this.element.textContent = this.text;
        this.parentElement.appendChild(this.element);
    }
}
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
class LoansView {

    constructor(parentElement, updater, onLoanRepaid, onLoanTaken) {
        this.parentElement = parentElement;
        this.updater = updater;
        this.onLoanTaken = onLoanTaken;
        this.onLoanRepaid = onLoanRepaid;
        this.loanViews = [];
    }

    create() {
        this.headerElement = document.createElement("h2");
        this.headerElement.textContent = "Loans";
        this.parentElement.appendChild(this.headerElement);

        this.infoView = new TextView("Intest is paid off daily", this.parentElement);
        this.infoView.create();

        this.interestView = new NumericView("loans-interest-view", "Interest rate", this.parentElement, () => this.updater().interestRate, true);
        this.interestView.create();

        this.amountView = new NumericView("loans-amount-view", "Loan amount ($)", this.parentElement, () => this.updater().baseAmount, true);
        this.amountView.create();

        const onTakeLoan = () => {
            const loan = this.updater().takeLoan();
            this.onLoanTaken(loan);
            this.update();
        }

        this.takeLoanButton = new Button("Take loan", this.parentElement, onTakeLoan);
        this.takeLoanButton.create();

        this.containerElement = document.createElement("div");
        this.containerElement.id = "loans-container";
        this.parentElement.appendChild(this.containerElement);
    }

    update() {
        const loans = this.updater();

        this.loanViews = [];

        while (this.containerElement.firstChild) {
            this.containerElement.removeChild(this.containerElement.firstChild);
        }

        loans.loans.forEach((loan, i) => {
            const onRepay = () => {
                loans.repayLoan(i);
                this.update(true);
                this.onLoanRepaid(loan);
            }

            const loanView = new LoanView(this.containerElement, () => loan, onRepay);
            loanView.create(i);
            this.loanViews.push(loanView);
        });

        this.headerElement.textContent = `Loans (${loans.loans.length})`;
        this.interestView.update();
        this.amountView.update();

        this.loanViews.forEach(view => view.update());
    }
}

class LoanView {

    constructor(parentElement, updater, onRepay) {
        this.parentElement = parentElement;
        this.updater = updater;
        this.onRepay = onRepay;
    }

    create(index = 0) {
        this.containerElement = document.createElement("div");
        this.containerElement.className = "loan-view";
        this.parentElement.appendChild(this.containerElement);

        this.amountView = new NumericView(`loan-amount-${index}`, "Amount", this.containerElement, () => this.updater().amount, true);
        this.amountView.create();

        this.interestView = new NumericView(`loan-interest-${index}`, "Interest", this.containerElement, () => this.updater().interest, true);
        this.interestView.create();

        this.rejectButton = new Button("Repay", this.containerElement, this.onRepay);
        this.rejectButton.create();
    }

    update() {
        this.amountView.update();
        this.interestView.update();
    }
}
class PassiveIncomeView {

    constructor(parentElement, updater, savingsAccountEvents) {
        this.parentElement = parentElement;
        this.updater = updater;
        this.savingsAccountEvents = savingsAccountEvents;
    }

    create() {
        this.headerElement = document.createElement("h2");
        this.headerElement.textContent = "Passive Income";
        this.parentElement.appendChild(this.headerElement);

        this.savingsAccountDiv = document.createElement("div");
        this.savingsAccountDiv.id = "savings-account-view";
        this.parentElement.appendChild(this.savingsAccountDiv);

        this.savingsAccountView = new SavingsAccountView(this.savingsAccountDiv, () => this.updater().savingsAccount, this.savingsAccountEvents.onDeposit, this.savingsAccountEvents.onWithdraw);
        this.savingsAccountView.create();
    }

    update() {
        this.savingsAccountView.update();
    }
}

class SavingsAccountView {

    constructor(parentElement, updater, onDeposit, onWithdraw) {
        this.parentElement = parentElement;
        this.updater = updater;
        this.onDeposit = onDeposit;
        this.onWithdraw = onWithdraw;
    }

    create() {
        this.headerElement = document.createElement("h3");
        this.headerElement.textContent = "Savings Account";
        this.parentElement.appendChild(this.headerElement);

        this.balanceView = new NumericView("savings-account-balance-view", "Balance ($)", this.parentElement, () => this.updater().balance, true);
        this.balanceView.create();

        this.interestView = new PercentView("savings-account-interest-view", "Daily interest", this.parentElement, () => this.updater().interest);
        this.interestView.create();

        this.depositActions = new SavingsAccountActions(this.parentElement, this.updater, "Deposit", amount => {
            if (this.onDeposit(amount)) {
                this.updater().deposit(amount);
                this.update();
            }
        });
        this.depositActions.create();

        this.withdrawActions = new SavingsAccountActions(this.parentElement, this.updater, "Withdraw", amount => {
            const amountWithdrawn = this.updater().withdraw(amount);
            this.onWithdraw(amountWithdrawn);
            this.update();
        });
        this.withdrawActions.create();
    }

    update() {
        this.balanceView.update();
        this.interestView.update();
    }
}

class SavingsAccountActions {

    constructor(parentElement, updater, actionLabel, onAction) {
        this.parentElement = parentElement;
        this.updater = updater;
        this.actionLabel = actionLabel;
        this.onAction = onAction;
    }

    create() {
        this.containerDiv = document.createElement("div");
        this.parentElement.appendChild(this.containerDiv);

        this.amountInput = document.createElement("input");
        this.amountInput.type = "number";
        this.amountInput.value = 0.0;
        this.containerDiv.appendChild(this.amountInput);

        const onZero = () => {
            this.amountInput.value = 0.0;
        }
        this.zeroButton = new Button("0", this.containerDiv, onZero);
        this.zeroButton.create();

        const onPlusOne = () => {
            this.amountInput.value = parseFloat(this.amountInput.value) + 1.0;
        }
        this.plusOneButton = new Button("+1", this.containerDiv, onPlusOne);
        this.plusOneButton.create();

        const onTenPercent = () => {
            this.amountInput.value = (this.updater().balance * 0.1).toFixed(2);
        }
        this.tenPercentButton = new Button("10%", this.containerDiv, onTenPercent);
        this.tenPercentButton.create();

        const onQuarter = () => {
            this.amountInput.value = (this.updater().balance * 0.25).toFixed(2);
        }
        this.quarterButton = new Button("25%", this.containerDiv, onQuarter);
        this.quarterButton.create();

        const onHalf = () => {
            this.amountInput.value = (this.updater().balance * 0.5).toFixed(2);
        }
        this.halfButton = new Button("50%", this.containerDiv, onHalf);
        this.halfButton.create();

        const onThreeQuarters = () => {
            this.amountInput.value = (this.updater().balance * 0.75).toFixed(2);
        }
        this.threeQuartersButton = new Button("75%", this.containerDiv, onThreeQuarters);
        this.threeQuartersButton.create();

        const onActionButton = () => {
            this.onAction(parseFloat(this.amountInput.value));
            onZero();
        }
        this.actionButton = new Button(this.actionLabel, this.containerDiv, onActionButton);
        this.actionButton.create();
    }

    update() {

    }
}
