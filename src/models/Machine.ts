class Machine {
  public stockLevel = 10;
  public id: string;
  public logLowStock: boolean = false;
  public logOkStock: boolean = false;

  constructor(id: string) {
    this.id = id;
  }
}

export { Machine }
