class AvailableJobs {

    constructor() {
        // TODO: Figure out level mechanics. Education/networking?
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
