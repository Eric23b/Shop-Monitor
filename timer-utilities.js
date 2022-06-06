export class Timer {
    constructor(callback, duration) {
        let timerObj = setInterval(callback, duration);

        this.stop = function () {
            if (timerObj) {
                clearInterval(timerObj);
                timerObj = null;
            }
            return this;
        };

        // start timer using current settings (if it's not already running)
        this.start = function () {
            if (!timerObj) {
                this.stop();
                timerObj = setInterval(callback, duration);
            }
            return this;
        };

        // start with new or original interval, stop current interval
        this.reset = function (newT = duration) {
            duration = newT;
            return this.stop().start();
        };
    }
}


export async function getDBEntrees() {

}