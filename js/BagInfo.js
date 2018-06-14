/*
    UI for editing bag-info.txt values
*/

export default class BagInfo {
    constructor(container) {
        this.container = container;

        this.elementBody = container.querySelector("tbody");

        this.elementTemplate = container.querySelector(
            "template#bag-info-element-template"
        );

        this.addElement(
            "Bagging-Date",
            new Date().toISOString().substring(0, 10)
        );

        container
            .querySelector(".add-element .dropdown-menu")
            .addEventListener("click", evt => {
                if ("label" in evt.target.dataset) {
                    this.addElement(evt.target.dataset.label);
                    return false;
                }
            });

        this.elementBody.addEventListener("click", evt => {
            if (evt.target.classList.contains("delete-row")) {
                evt.target.parentNode.parentNode.remove();
            }
        });
    }

    addElement(label, value) {
        label = (label || "").trim();
        value = (value || "").trim();

        let entryTemplate = document.importNode(
            this.elementTemplate.content,
            true
        );

        entryTemplate.querySelector(".bag-info-label").value = label;
        entryTemplate.querySelector(".bag-info-value").value = value;

        this.elementBody.appendChild(entryTemplate);
    }

    getValues() {
        // This is not a Map because bag-info.txt allows multiple values for the same label and we must preserve ordering:
        let info = [];
        this.container.querySelectorAll("tbody tr").forEach(row => {
            let labelInput = row.querySelector(
                "input.bag-info-label:not(:invalid)"
            );
            let valueInput = row.querySelector(
                "input.bag-info-value:not(:invalid)"
            );
            if (labelInput && valueInput) {
                info.push([labelInput.value, valueInput.value]);
            }
        });
        return info;
    }
}
