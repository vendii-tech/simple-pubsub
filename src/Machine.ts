export class Machine{
    public stockLevel = 10;
    public id: string;
    public _isLowStock = false;

    constructor(id: string){
        this.id = id;
    }

    get isLowStock(): boolean{
        return this._isLowStock;
    }

    set isLowStock(value: boolean){
        this._isLowStock = value;
    }
}