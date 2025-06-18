class UniqueTimestampGenerator {
    constructor() {
        this.lastTimeStamp = 0;
        this.counter = 0;
    }

    generateId() {
        
        const currentTimestamp = Date.now();
        if (currentTimestamp === this.lastTimeStamp) {
            this.counter++;
        } else {
            this.counter = 0;
            this.lastTimestamp = currentTimestamp;
        }

        const paddedCounter = this.counter.toString().padStart(3, '0'); // 000, 001, 002...
        
        return `${currentTimestamp}_${paddedCounter}`;
    }
}

module.exports = UniqueTimestampGenerator;