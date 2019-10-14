class NumericView {

    constructor(name, label, parentElement, updater, isDecimal) {
        this.name = name;
        this.label = label;
        this.parentElement = parentElement;
        this.updater = updater;
        this.isDecimal = isDecimal;
    }

    create() {
        const element = document.createElement("p");
        const labelText = document.createTextNode(`${this.label}: `);
        element.appendChild(labelText);
        this.viewElement = document.createElement("span");
        this.viewElement.id = `numeric-view-${this.name}`;
        const initVal = 0;
        this.viewElement.textContent = this.isDecimal ? initVal.toFixed(2) : initVal;
        element.appendChild(this.viewElement);
        this.parentElement.appendChild(element);
    }

    update() {
        const newVal = this.updater();
        this.viewElement.textContent = this.isDecimal ? newVal.toFixed(2) : newVal;
    }
}
