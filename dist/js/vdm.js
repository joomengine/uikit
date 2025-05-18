/**
 * VDM Uikit v3.0.1
 * https://git.vdm.dev/joomla/uikit
 * (c) 2020 - 2025 Llewellyn van der Merwe
 * MIT License
 **/

(function () {
    'use strict';

    /**
     * `FileType` is a utility class that simplifies operations related to file uploading.
     * It handles the storage and retrieval of metadata associated with each upload and initializes
     * the upload process by setting up endpoint configuration. It also provides methods for
     * triggering the upload activities in an asynchronous manner.
     *
     * @class
     * @example
     * const helper = new FileType('http://example.com/upload');
     * const uniqueId = 'file123';
     * const globalId = 'glob124';
     * const data = { user: 'John Doe', file: 'myfile.txt' };
     *
     * helper.set(uniqueId, data);
     * await helper.init(uniqueId, globalId);
     */
    class FileType {
        /**
         * The endpoint to which files would be uploaded.
         * Stored as a private property and used internally within the class methods.
         * This field must be a string representing a valid URL.
         *
         * @type {string}
         * @private
         */
        #endpoint;

        /**
         * It is a private object used to store the data associated with an instance of `FileType`.
         * Default is an empty object.
         * This data is used when performing uploads.
         *
         * @type {Object}
         * @private
         */
        #data = {};

        /**
         * Constructor for the FileType class.
         *
         * @param {string} endpoint - The endpoint to be associated with the instance of the FileType.
         */
        constructor(endpoint) {
            // Initialize private field with passed endpoint argument
            this.#endpoint = endpoint;
        }

        /**
         * Stores a value associated with a provided key in data or merges an input object with the data.
         *
         * @param {string} id - The unique identifier associated with the data to store.
         * @param {string|object} keyOrObject - The key to associate with a value within the provided identifier or an object to merge with the data.
         * @param {any} [value=null] - The value to set for the specific key. Only used if keyOrObject isn't an object. Defaults to null.
         */
        set = (id, keyOrObject, value = null) => {
            // Initialize data object for the ID if it does not exist
            this.#data[id] = this.#data[id] || {};

            if (typeof keyOrObject === 'object') {
                // If keyOrObject is an object, merge it with the existing data for the provided ID
                Object.assign(this.#data[id], keyOrObject);
            } else {
                // If keyOrObject is not an object, treat it as a key and associate it with the provided value in the data
                this.#data[id][keyOrObject] = value;
            }
        };

        /**
         * Retrieves the value for a specific key from data.
         *
         * @param {string} id - The unique identifier associated with the data.
         * @param {string|null} [key=null] - The key whose associated value to return from within the identified data. If not specified,
         *                              the entire data object associated with the identifier will be returned instead.
         * @param {any} [defaultValue=null] - The value to return if the key or identifier is not found in the data. Defaults to null.
         * @returns {any} The value associated with the provided key if found, the data object
         *                if only an identifier is provided, or the default value if the key or
         *                identifier cannot be found in the data.
         */
        get = (id, key = null, defaultValue = null) => {
            const idData = this.#data[id];

            if (!idData) {
                // If the ID does not exist in the data, return the default value
                return defaultValue;
            }

            if (key === null) {
                // If no specific key is specified, return the entire data object for the ID
                return idData;
            }

            // If the key exists in the data object, return its value; otherwise, return the default value
            return idData[key] ?? defaultValue;
        };

        /**
         * Asynchronously initializes the FileType object.
         *
         * @param {string} id - The unique identifier associated with the initialization.
         * @param {string} guid - The globally unique identifier used to build the URL for fetching.
         * @param {boolean} reset - A flag indicating whether to reset the initialization. Defaults to false.
         * @return {Promise.<void>} Returns promise which resolves when operation is complete.
         *                          There is no resolved value but any error occurred while
         *                          operation will be thrown.
         */
        init = async (id, guid, reset = false) => {
            if (this.#data[id] && !reset) {
                console.log(`Field ${id} is already initialized, reusing existing data.`);
                return;
            }

            try {
                const url = this.#buildUrl(guid);
                const result = await this.#fetchData(url);

                if (true) console.log('Data fetched:', result);

                if (result?.data && typeof result.data === 'object') {
                    this.set(id, result.data);
                } else if (result?.error) {
                    throw new Error(result.error || 'An error occurred during the file type request.');
                }
            } catch (error) {
                console.error('Error during initialization:', error);
            }
        };

        /**
         * Fetches data from provided URL.
         *
         * @param {string} url - The URL from which the data should be fetched.
         * @return {Promise.<Object|undefined>} Returns fetched data or undefined if data fetch was unsuccessful.
         */
        #fetchData = async url => {
            const response = await fetch(url, {
                method: 'GET',
                headers: {'Content-Type': 'application/json'},
            });

            if (!response.ok) {
                console.error('Error fetching data:', response);
                return;
            }

            return await response.json();
        };

        /**
         * Retrieves values associated with a provided list of identifiers from the DOM.
         *
         * @param {Array.<string>} ids - The list of identifiers associated to DOM fields to retrieve values from.
         * @returns {Object.<string, string>} An object containing the values of the fields with its id as properties' names.
         */
        getParams = ids => {
            // Initialize a params object to hold our field values
            const params = {};

            // Use early return if ids is not an array or is an empty array
            if (!Array.isArray(ids) || ids.length === 0) {
                return params;
            }

            // Using forEach method on the ids array to populate the params object
            ids.forEach(id => {
                // Get the DOM field for the current id
                const field = document.getElementById(id);

                // If the field exists, add its value to params object using id as the key
                if (field) {
                    params[id] = field.value;
                }
            });

            // Return the params object, which now contains the field values
            return params;
        };

        /**
         * Builds a URL appending a unique identifier as a parameter.
         *
         * @param {string} guid - The globally unique identifier to append to the URL.
         * @returns {string} The constructed URL with the appended unique identifier.
         * @private
         */
        #buildUrl = (guid) => {
            // Determine the appropriate separator for the query parameter
            const separator = this.#endpoint.includes('?') ? '&' : '?';

            // Return the constructed URL
            return `${this.#endpoint}${separator}guid=${guid}`;
        };
    }

    /**
     * The `DisplayHelper` class assists with fetching HTML content from a specified endpoint
     * and injecting it into a specified DOM area.
     * It constructs the endpoint URL, fetches the HTML, and manages filling/clearing the DOM area.
     *
     * @class
     * @example
     * const helper = new DisplayHelper();
     * const endpoint = 'http://example.com/data';
     * const area = document.getElementById('displayArea');
     * const params = { user: 'John Doe', limit: 10 };
     *
     * await helper.set(endpoint, area, params);
     */
    class Display {
        constructor() {
        }

        /**
         * Asynchronously fetches HTML content from a specified endpoint and injects it into a specified DOM area.
         * If any error occurs during this operation and the debug mode is enabled, the error will be logged to the console.
         * The display area is emptied when any error occurs or if the fetched content is empty.
         *
         * @async
         * @param {string} displayEndpoint - The endpoint from which the HTML content is fetched.
         * @param {HTMLElement} displayArea - The DOM element wherein the fetched content is to be injected.
         * @param {object} params - The query parameters to be appended to the endpoint URL.
         * @throws Will throw an error if the fetch operation fails.
         */
        set = async (displayEndpoint, displayArea, params) => {
            try {
                // Trigger a custom event before hide files display the entity files
                this.#dispatchEvent('beforeGetFilesDisplay', {endpoint: displayEndpoint, element: displayArea, params: params});

                // Build the URL with the query parameters
                const url = this.#buildUrl(displayEndpoint, params);

                // Fetch the HTML content from the displayEndpoint
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    // If an error occurs, log it in debug mode
                    if (true) {
                        console.error('Error fetching display data:', response);
                    }
                    return;
                }

                const result = await response.json();

                // Check if result contains an error
                if (result.error) {
                    // Log the error in debug mode and show a user-friendly message
                    if (true) {
                        console.error('Error fetching display data:', result.error);
                    }
                    return;
                }

                // If there's no response.data or it's empty, clear the display area
                if (!result.data || result.data.trim() === '') {
                    // Trigger a custom event before hide files display the entity files
                    this.#dispatchEvent('beforeHideFilesDisplay', {result: result, element: displayArea});

                    displayArea.innerHTML = ''; // Empty the display area
                    displayArea.setAttribute('hidden', 'hidden');

                    // Trigger a custom event after hide files display the entity files
                    this.#dispatchEvent('afterHideFilesDisplay', {result: result, element: displayArea});
                } else {
                    // Trigger a custom event before displaying the entity files
                    this.#dispatchEvent('beforeFilesDisplay', {result: result, element: displayArea});

                    // Replace the display area content with the new HTML
                    displayArea.innerHTML = result.data;
                    displayArea.removeAttribute('hidden');

                    // Trigger a custom event after displaying the entity files
                    this.#dispatchEvent('afterFilesDisplay', {result: result, element: displayArea});
                }
            } catch (error) {
                // If an error occurs, log it in debug mode
                {
                    console.error('Error fetching display data:', error);
                }
            }
        };

        /**
         * Dispatches a custom event with optional detail data.
         *
         * @param {string} eventName - The name of the event to dispatch.
         * @param {object} [detail={}] - The optional detail data to include with the event.
         * @return {void}
         */
        #dispatchEvent(eventName, detail = {}) {
            document.dispatchEvent(new CustomEvent(`vdm.uikit.display.${eventName}`, {detail}));
        }

        /**
         * It's a private method that builds a complete URL from the endpoint and an object containing parameters.
         * It uses the URLSearchParams interface to turn the parameters object to a query string,
         * then, it attaches this string to the endpoint.
         * If endpoint already includes a query string, the parameters string is prefixed with '&' char or else with '?' char.
         *
         * @param {string} endpoint - The base URL to which the parameters should be appended.
         * @param {object} params - The object containing key-value pairs to be converted into a URL query string.
         * @returns {string} The full URL with the appended query parameters.
         * @private
         */
        #buildUrl = (endpoint, params) => {
            // If no params or params is empty, return the endpoint as is
            if (!params || Object.keys(params).length === 0) {
                return endpoint;
            }

            // Convert the params object into URL query string using URLSearchParams
            const separator = endpoint.includes('?') ? '&' : '?';
            const urlParams = new URLSearchParams(params);
            return `${endpoint}${separator}${urlParams.toString()}`; // Return the full URL with query params
        };
    }

    /**
     * Class for uploading files.
     *
     * @class
     * @classdesc This class provides methods for uploading files to a server.
     */
    class UploadFile {
        /**
         * Utility class for uploading files.
         *
         * @class
         */
        #fileType;

        /**
         * Helper class for displaying elements on the UI.
         *
         * @class
         */
        #display;

        /**
         * The UIKit variable is a reference to a UI framework for building web applications.
         */
        #uikit;

        /**
         * Creates an instance of the UploadFile class.
         *
         * @param {Object} config - Configuration details for uploader instances.
         * @param {string} endpoint - The endpoint where the files will be uploaded.
         * @param {any} uikit - Reference to UIKit.
         */
        constructor(config, endpoint, uikit) {
            this.#fileType = new FileType(endpoint);
            this.#display = new Display();
            this.#uikit = uikit;

            this.#initializeFields(config);
        }

        /**
         * Initializes all upload fields based on the config.
         *
         * @param {Object} config - Configuration object mapping field IDs to their parameters.
         */
        #initializeFields(config) {
            Object.keys(config).forEach(id => {
                this.#initField(id, config[id]);
            });
        }

        /**
         * Initializes a field with given parameters and sets up its event listener.
         *
         * @param {string} id - The identifier for the field.
         * @param {Object} entity - Configuration parameters for the field.
         */
        #initField(id, entity) {
            const {
                bar, typeId, endpoint, successId, errorId, allowedFormatId, fileTypeId, displayId, displayEndpoint
            } = entity;

            this.#setupDisplayArea(displayEndpoint, displayId);

            const typeField = document.getElementById(typeId);
            if (!typeField) {
                this.#logError(`Type field with ID ${typeId} not found`);
                return;
            }

            const initializeUpload = async (guid) => {
                if (guid && guid.length > 1) {
                    try {
                        await this.#initUpload(id, guid, bar, endpoint, successId, errorId, allowedFormatId, fileTypeId, displayId, displayEndpoint);
                    } catch (error) {
                        this.#showNotification(error.message, 'danger');
                    }
                }
            };

            typeField.addEventListener('change', () => initializeUpload(typeField.value));
            initializeUpload(typeField.value).catch(error => this.#showNotification(error.message, 'danger'));
        }

        /**
         * Initializes the upload process and sets up the UI elements.
         *
         * @param {string} id - The identifier for the field.
         * @param {string} typeGuid - The type GUID for the field.
         * @param {string} progressBarId - The ID of the progress bar element.
         * @param {string} uploadEndpoint - The endpoint URL for the upload.
         * @param {string|null} successId - The ID of the success message element.
         * @param {string|null} errorId - The ID of the error message element.
         * @param {string|null} allowedFormatId - The ID of the allowed format element.
         * @param {string|null} fileTypeId - The ID of the file type element.
         * @param {string|null} displayId - The ID of the display element.
         * @param {string|null} displayEndpoint - The endpoint URL for displaying the uploaded file.
         */
        async #initUpload(id, typeGuid, progressBarId, uploadEndpoint, successId, errorId, allowedFormatId, fileTypeId, displayId, displayEndpoint) {
            try {
                this.#dispatchEvent('beforeInit', {
                    id,
                    typeGuid,
                    progressBarId,
                    uploadEndpoint,
                    successId,
                    errorId,
                    allowedFormatId,
                    fileTypeId,
                    displayId,
                    displayEndpoint
                });

                const call = `${id}${typeGuid}`;
                await this.#fileType.init(call, typeGuid, true);

                const elements = this.#getUploadElements(progressBarId, successId, errorId, allowedFormatId, fileTypeId, displayId);

                this.#dispatchEvent('afterElementsInit', {...elements});

                this.#prepareUploadUI(elements, call, successId, errorId);

                this.#uikit.upload(`#${id}`, {
                    url: this.#buildUrl(uploadEndpoint, typeGuid),
                    multiple: true,
                    allow: this.#fileType.get(call, 'allow', false),
                    name: this.#fileType.get(call, 'name', 'files'),
                    beforeSend: (env) => this.#handleBeforeSend(call, env),
                    beforeAll: (files) => this.#dispatchEvent('beforeAll', {files}),
                    load: (e) => this.#dispatchEvent('load', {event: e}),
                    error: (error) => this.#handleUploadError(error, elements.errorMessage),
                    complete: (xhr) => this.#handleComplete(xhr, elements.successMessage),
                    loadStart: (e) => this.#handleLoadStart(e, elements.progressBar),
                    progress: (e) => this.#handleProgress(e, elements.progressBar),
                    loadEnd: (e) => this.#handleLoadEnd(e, elements.progressBar),
                    completeAll: (xhr) => this.#handleCompleteAll(xhr, elements.progressBar, elements.successMessage, elements.errorMessage, displayEndpoint, displayId, call)
                });
            } catch (error) {
                throw error;
            }
        }

        /**
         * Returns the required HTML elements by their IDs.
         * If an element ID is null or the element does not exist on the page,
         * the corresponding value in the returned object will be null.
         *
         * @param {string|null} progressBarId - The ID of the progress bar element, or null.
         * @param {string|null} successId - The ID of the success message element, or null.
         * @param {string|null} errorId - The ID of the error message element, or null.
         * @param {string|null} allowedFormatId - The ID of the allowed format span element, or null.
         * @param {string|null} fileTypeId - The ID of the file type span element, or null.
         * @param {string|null} displayId - The ID of the display area element, or null.
         * @returns {object} - An object containing the required HTML elements or null if they do not exist.
         */
        #getUploadElements(progressBarId, successId, errorId, allowedFormatId, fileTypeId, displayId) {
            return {
                progressBar: progressBarId ? document.getElementById(progressBarId) : null,
                successMessage: successId ? document.getElementById(successId) : null,
                errorMessage: errorId ? document.getElementById(errorId) : null,
                allowedFormatSpan: allowedFormatId ? document.getElementById(allowedFormatId) : null,
                fileTypeSpan: fileTypeId ? document.getElementById(fileTypeId) : null,
                displayArea: displayId ? document.getElementById(displayId) : null
            };
        }

        /**
         * Initializes the display area with data from the display endpoint.
         *
         * @param {string|null} displayEndpoint - The endpoint to retrieve the display data from.
         * @param {string|null} displayId - The id of the display area element in the DOM.
         * @param {object} params - Additional parameters to be passed to the display helper.
         * @return {void}
         */
        #setupDisplayArea(displayEndpoint, displayId, params = {}) {
            const displayArea = displayId ? document.getElementById(displayId) : null;
            if (displayEndpoint && displayArea) {
                this.#display.set(displayEndpoint, displayArea, params);
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
         * Logs an error to the console.
         *
         * @param {string} message - The error message to be logged.
         *
         * @return {undefined}
         */
        #logError(message) {
            {
                console.error(message);
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
            document.dispatchEvent(new CustomEvent(`vdm.uikit.uploader.${eventName}`, {detail}));
        }

        /**
         * Builds a URL by appending the GUID parameter.
         *
         * @param {string} endpoint - The base URL endpoint.
         * @param {string} guid - The GUID parameter to be appended to the URL.
         * @return {string} - The constructed URL with the GUID parameter appended.
         */
        #buildUrl(endpoint, guid) {
            const separator = endpoint.includes('?') ? '&' : '?';
            return `${endpoint}${separator}guid=${guid}`;
        }

        /**
         * Prepares the UI elements before starting the upload.
         *
         * @param {object} elements - The UI elements to be modified.
         * @param {string} call - The call identifier.
         * @param {string} successId - The id of the success message element.
         * @param {string} errorId - The id of the error message element.
         */
        #prepareUploadUI(elements, call, successId, errorId) {
            if (elements.successMessage) elements.successMessage.setAttribute('hidden', 'hidden');
            if (elements.errorMessage) elements.errorMessage.setAttribute('hidden', 'hidden');
            if (elements.allowedFormatSpan) elements.allowedFormatSpan.innerHTML = this.#fileType.get(call, 'allow_span', '');
            if (elements.fileTypeSpan) elements.fileTypeSpan.innerHTML = this.#fileType.get(call, 'file_type_span', 'file');
        }

        /**
         * Handles beforeSend logic for uploads.
         *
         * @param {object} call - The call object.
         * @param {object} environment - The environment object.
         * @return {void}
         */
        #handleBeforeSend(call, environment) {
            this.#dispatchEvent('beforeSend', {environment});
            environment.data.params = this.#fileType.getParams(this.#fileType.get(call, 'param_fields'));
            this.#dispatchEvent('afterSendPreparation', {environment});
        }

        /**
         * Handles the error scenario during upload.
         *
         * @param {Error} error - The error object that occurred during upload.
         * @param {HTMLElement} errorMessage - The element used to display the error message.
         *
         * @return {void}
         */
        #handleUploadError(error, errorMessage) {
            this.#dispatchEvent('error', {error});
            if (errorMessage) {
                errorMessage.removeAttribute('hidden');
                errorMessage.textContent = 'Upload failed.';
            }
        }

        /**
         * Handles the upload completion.
         *
         * @param {XMLHttpRequest} xhr - The XMLHttpRequest object representing the upload request.
         * @param {HTMLElement|null} successMessage - The success message element to display.
         */
        #handleComplete(xhr, successMessage) {
            this.#dispatchEvent('complete', {xhr});
            if (successMessage) {
                successMessage.removeAttribute('hidden');
                successMessage.textContent = 'Upload completed successfully.';
            } else {
                this.#showNotification('Upload completed successfully.', 'primary');
            }
        }

        /**
         * Handles the loadStart event.
         *
         * @param {Event} e - The loadStart event object.
         * @param {HTMLElement|null} progressBar - The progress bar element. Optional.
         * @return {void}
         */
        #handleLoadStart(e, progressBar) {
            this.#dispatchEvent('loadStart', {event: e});
            if (progressBar) {
                progressBar.removeAttribute('hidden');
                progressBar.max = e.total;
                progressBar.value = e.loaded;
            }
        }

        /**
         * Handles the progress event.
         *
         * @param {Event} e - The progress event.
         * @param {Element|null} progressBar - The progress bar element.
         *
         * @return {void}
         */
        #handleProgress(e, progressBar) {
            this.#dispatchEvent('progress', {event: e});
            if (progressBar) {
                progressBar.max = e.total;
                progressBar.value = e.loaded;
            }
        }

        /**
         * Handles the loadEnd event.
         *
         * @param {Event} e - The loadEnd event object.
         * @param {Element|null} progressBar - The progress bar element to update.
         *
         * @return {void}
         */
        #handleLoadEnd(e, progressBar) {
            this.#dispatchEvent('loadEnd', {event: e});
            if (progressBar) {
                progressBar.max = e.total;
                progressBar.value = e.loaded;
            }
        }

        /**
         * Handles the completion of all uploads.
         *
         * @param {XMLHttpRequest} xhr - The XMLHttpRequest object used for the uploads.
         * @param {HTMLElement|null} progressBar - The progress bar element.
         * @param {HTMLElement|null} successMessage - The success message element.
         * @param {HTMLElement|null} errorMessage - The error message element.
         * @param {string|null} displayEndpoint - The display endpoint.
         * @param {string|null} displayId - The display ID.
         * @param {Object} call - The call object.
         *
         * @return {void}
         */
        #handleCompleteAll(xhr, progressBar, successMessage, errorMessage, displayEndpoint, displayId, call) {
            this.#dispatchEvent('completeAll', {xhr});
            if (progressBar) {
                setTimeout(() => {
                    progressBar.setAttribute('hidden', 'hidden');
                    if (successMessage) successMessage.setAttribute('hidden', 'hidden');
                    if (errorMessage) errorMessage.setAttribute('hidden', 'hidden');
                }, 5000);
            }
            this.#setupDisplayArea(displayEndpoint, displayId, this.#fileType.getParams(this.#fileType.get(call, 'display_fields')));
        }
    }

    /**
     * Helper class for deleting files from the server.
     *
     * @class
     * @classdesc This class provides methods for deleting files from the server.
     */
    class DeleteFile {
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
                console.error(DeleteFile.ERROR_ENDPOINT);
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

    (function(global) {
        document.addEventListener('DOMContentLoaded', function() {
            let UIkitLocal;

            if (!global.UIkit) {
                UIkitLocal = require('uikit').default;
            } else {
                UIkitLocal = global.UIkit;
            }

            if (!global.VDM) {
                console.error('VDM is not defined, exiting initialization.');
                return;
            }

            const { endpoint_type, target_class, ...additionalConfig } = global.VDM.uikit.config || {};

            if (!endpoint_type) {
                console.error('File Type Endpoint is not defined, exiting initialization.');
                return;
            }

            if (!target_class) {
                console.error('The target class is not defined, exiting initialization.');
                return;
            }

            const uploadElements = document.querySelectorAll('.' + target_class);
            const config = {};

            // Ensure the global.VDM.uikit.delete_file exists, or initialize it
            if (!global.VDM.uikit.delete_file) {
                global.VDM.uikit.delete_file = {};  // Initialize delete_file object if it doesn't exist
            }

            uploadElements.forEach(element => {
                const id = element.getAttribute('id');
                const uploadEndpoint = additionalConfig[id]?.endpoint_upload ?? null;

                if (!uploadEndpoint) {
                    console.error(`Upload Endpoint for ${id} is not defined, exiting initialization for this field.`);
                    return; // Skip this field if no upload endpoint is found
                }

                const typeId = element.dataset.typeId;

                // optional
                const progressBarId = element.dataset.progressbarId ?? null;
                const displayEndpoint = additionalConfig[id]?.endpoint_display ?? null;
                const displayId = element.dataset.displayId || null;
                const deleteEndpoint = additionalConfig[id]?.endpoint_delete ?? null;
                const successId = element.dataset.successId || null;
                const errorId = element.dataset.errorId || null;
                const allowedFormatId = element.dataset.allowedFormatId || null;
                const fileTypeId = element.dataset.fileTypeId || null;

                config[id] = {
                    bar: progressBarId,
                    typeId: typeId,
                    endpoint: uploadEndpoint,
                    successId: successId,
                    errorId: errorId,
                    allowedFormatId: allowedFormatId,
                    fileTypeId: fileTypeId,
                    displayId: displayId,
                    displayEndpoint: displayEndpoint
                };

                // if delete endpoint found
                if (deleteEndpoint)
                {
                    global.VDM.uikit.delete_file[id] = new DeleteFile(deleteEndpoint, UIkitLocal);
                }
            });

            if (Object.keys(config).length > 0) {
                new UploadFile(config, endpoint_type, UIkitLocal);
            }

        });

        /**
         * Performs a delete operation on the specified file.
         *
         * @param {string} id - The identifier of the delete_file object.
         * @param {string} guid - The file GUID to delete.
         *
         * @return {void} - No return value.
         */
        global.VDMDeleteFile = function(id, guid) {
            const deleteInstance = global.VDM.uikit.delete_file[id];

            if (!deleteInstance || !(deleteInstance instanceof DeleteFile)) {
                console.error(`Error: delete_file with id ${id} is either not defined or not an instance of DeleteFile.`);
            }

            deleteInstance.delete(guid);
        };

        /**
         * Performs a delete operation on the specified set of files.
         *
         * @param {string} id - The identifier of the delete_file object.
         * @param {string[]} guids - Array of file GUIDs to delete.
         *
         * @return {void}
         */
        global.VDMDeleteFiles = function(id, guids) {
            const deleteInstance = global.VDM.uikit.delete_file[id];

            if (!Array.isArray(guids) || guids.length === 0) {
                console.error('No GUIDs provided for deletion.');
                return;
            }

            if (!deleteInstance || !(deleteInstance instanceof DeleteFile)) {
                console.error(`Error: delete_file with id ${id} is either not defined or not an instance of DeleteFile.`);
                return;
            }

            const [first, ...rest] = guids;

            const handler = (event) => {
                if (event.detail?.guid === first) {
                    // Cleanup
                    document.removeEventListener('vdm.uikit.delete.afterFileDelete', handler);

                    // Delete remaining without confirmation
                    rest.forEach(guid => deleteInstance.delete(guid, false));
                }
            };

            // Listen for confirmation result of first file
            document.addEventListener('vdm.uikit.delete.afterFileDelete', handler);

            // Initiate first deletion (with confirmation inside delete())
            deleteInstance.delete(first);
        };

    })(window);

})();
