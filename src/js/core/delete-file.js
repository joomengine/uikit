/**
 * Helper class for deleting files from the server.
 *
 * @class
 * @classdesc This class provides methods for deleting files from the server.
 */
export class DeleteFile {
    /**
     * The endpoint to which files would be deleted.
     * Stored as a private property and used internally within the class methods.
     * This field must be a string representing a valid URL.
     *
     * @type {string}
     * @private
     */
    #endpoint;

    /**
     * The UIKit variable is a reference to a UI framework for building web applications.
     */
    #uikit;

    /**
     * The error message that is displayed when the delete endpoint is not configured.
     *
     * @type {string}
     */
    static ERROR_ENDPOINT = 'Error: The delete endpoint is not configured.';

    /**
     * Creates an instance of the DeleteHelper class.
     *
     * @param {string} endpoint - The endpoint where the files will be uploaded.
     * @param {any} uikit - Reference to UIKit.
     */
    constructor(endpoint, uikit) {
        this.#endpoint = endpoint;
        this.#uikit = uikit;
    }

    /**
     * Deletes a file with the given fileGuid.
     *
     * @param {string} fileGuid - The unique identifier of the file to delete.
     * @param {boolean} [confirm=true] - Whether to show the confirmation modal.
     * @return {void}
     */
    delete(fileGuid, confirm = true) {
        if (!fileGuid || fileGuid.length <= 30) {
            return;
        }

        if (confirm) {
            this.#uikit.modal.confirm('Are you sure you want to delete this file! It can not be undone!')
                .then(() => this.#serverDelete(fileGuid));
        } else {
            this.#serverDelete(fileGuid);
        }
    }

    /**
     * Deletes a file from the server.
     *
     * @param {string} fileGuid - The unique identifier of the file to be deleted.
     * @return {void}
     */
    #serverDelete(fileGuid) {
        if (!this.#endpoint) {
            if (process.env.DEBUG) console.error(DeleteFile.ERROR_ENDPOINT);
            return;
        }

        this.#dispatchEvent('beforeFileDelete', {guid: fileGuid});

        fetch(this.#buildUrl(fileGuid), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(response => response.json())
            .then(this.#handleResponse.bind(this, fileGuid))
            .catch(console.error);
    }

    /**
     * Handles the response from the server after a file upload.
     * Removes the file from the UI if the response is successful and shows a success notification.
     * Shows an error notification if the response contains an error.
     * @param {string} fileGuid - The unique identifier of the file that was uploaded.
     * @param {object} data - The response data from the server.
     * @return {void}
     */
    #handleResponse(fileGuid, data) {
        if (data.success) {
            this.#fileRemoveFromUI(fileGuid);
            this.#showNotification(data.success, 'primary');
            this.#dispatchEvent('afterFileDelete', {data: data, guid: fileGuid});
        } else if (data.error) {
            this.#dispatchEvent('onFileDeleteError', {data: data, guid: fileGuid});
            this.#showNotification(data.error, 'danger');
        }
    }

    /**
     * Displays a notification with the given message and status.
     *
     * @param {string} message - The message to be displayed in the notification.
     * @param {string} status - The status of the notification (e.g., 'success', 'error', 'warning').
     * @return {void} - Does not return a value.
     */
    #showNotification(message, status) {
        this.#uikit.notification({
            message,
            status,
            pos: 'top-center',
            timeout: 7000
        });
    }

    /**
     * Remove file from user interface by fileGuid.
     *
     * @param {string} fileGuid - The unique identifier of the file.
     * @example
     * removeFileFromUI('file123')
     *
     * @return {void} - No return value.
     */
    #fileRemoveFromUI(fileGuid) {
        const listItem = document.getElementById(fileGuid);
        if (listItem) {
            this.#dispatchEvent('beforeFileRemoveFromUI', {element: listItem, guid: fileGuid});
            listItem.remove();
        }
    }

    /**
     * Dispatches a custom event with optional detail data.
     *
     * @param {string} eventName - The name of the event to dispatch.
     * @param {object} [detail={}] - The optional detail data to include with the event.
     * @return {void}
     */
    #dispatchEvent(eventName, detail = {}) {
        document.dispatchEvent(new CustomEvent(`vdm.uikit.delete.${eventName}`, {detail}));
    }

    /**
     * Builds a URL by appending the GUID parameter.
     *
     * @param {string} guid - The GUID parameter to be appended to the URL.
     * @return {string} - The constructed URL with the GUID parameter appended.
     */
    #buildUrl(guid) {
        const separator = this.#endpoint.includes('?') ? '&' : '?';
        return `${this.#endpoint}${separator}guid=${guid}`;
    }
}