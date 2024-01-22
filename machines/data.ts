
// objects
export class Machine {
    public stockLevel = new Uint8Array(new SharedArrayBuffer(1))
    public id: string;
  
    constructor (id: string) {
      this.id = id;
      Atomics.store(this.stockLevel, 0, 10)
    }
  }
  