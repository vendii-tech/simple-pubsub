
// objects
export class Machine {
    public stockLevel = new Uint16Array(new SharedArrayBuffer(2))
    public id: string;
  
    constructor (id: string) {
      this.id = id;
      Atomics.store(this.stockLevel, 0, 1)
    }
  }
  