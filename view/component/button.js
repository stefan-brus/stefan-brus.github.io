class Button {

    constructor(label, parentElement, onClick) {
        this.label = label;
        this.parentElement = parentElement;
        this.onClick = onClick;
    }

    create() {
        this.buttonDiv = document.createElement("div");
        this.buttonDiv.className = "button";
        this.buttonDiv.textContent = this.label;
        this.buttonDiv.onclick = this.onClick;
        this.parentElement.appendChild(this.buttonDiv);
    }
}
