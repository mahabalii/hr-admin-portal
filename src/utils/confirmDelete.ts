
export const confirmDelete = (message: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const dialog = document.createElement("dialog");
    dialog.className = "custom-delete-dialog";

    const content = document.createElement("div");
    content.className = "custom-delete-content";

    const icon = document.createElement("div");
    icon.className = "custom-delete-icon";
    icon.textContent = "!";

    const title = document.createElement("h2");
    title.textContent = "Confirm Delete Request";

    const description = document.createElement("p");
    description.textContent = message;

    const actions = document.createElement("div");
    actions.className = "custom-delete-actions";

    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.className = "custom-delete-cancel";
    cancelButton.textContent = "Cancel";

    const confirmButton = document.createElement("button");
    confirmButton.type = "button";
    confirmButton.className = "custom-delete-confirm";
    confirmButton.textContent = "Submit Request";

    actions.append(cancelButton, confirmButton);
    content.append(icon, title, description, actions);
    dialog.appendChild(content);
    document.body.appendChild(dialog);

    const cleanup = (confirmed: boolean) => {
      dialog.close();
      dialog.remove();
      resolve(confirmed);
    };

    cancelButton.addEventListener("click", () => cleanup(false));
    confirmButton.addEventListener("click", () => cleanup(true));

    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) cleanup(false);
    });

    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      cleanup(false);
    });

    dialog.showModal();
  });
};
