/*
 * Copyright (C) 2017 CONTACT Software GmbH
 * All rights reserved.
 * http://www.contact-software.com
 *
 * Revision "$Id$"
 */

import Immutable from 'immutable';
import {Registry} from '../registry.js';
import {postJSON} from '../fetch.js';
import FrontendDialog from './FrontendDialog.js';
import fieldTypes from './fieldTypes';

/**
 * Implementation of the dialog-hooks API
 *
 * @module
 */

/**
 * Context for dialog hooks: provides values and API to hook implementations.
 */
class DialogHooksContext {
    constructor({
        oldValues,
        changes,
        operationState,
        newValues,
        registers,
        preventSubmitReasons,
        wizardProgress,
    }) {
        this.oldValues = oldValues;
        this.changes = changes;
        this.operationState = operationState;
        this.newValues = newValues;
        this.registers = registers;
        this.preventSubmitReasons = preventSubmitReasons;
        this.wizardProgress = wizardProgress;
        this.dialog = null;
    }

    /**
     * Internal method: prepare data to POST to the backend when calling hooks.
     */
    getBackendRequestData(hook_ids) {
        return {
            old_values: this.oldValues,
            changes: this.changes,
            operation_state: this.operationState,
            new_values: this.newValues,
            wizard_progress: this.wizardProgress,
            ids: hook_ids,
        };
    }

    /**
     * Internal method: consume the backend's answer from calling hooks.
     */
    applyBackendResult(data) {
        this.setValues(data.new_values);

        const roChanges = Immutable.fromJS(data.ro_changes);
        roChanges.forEach((new_ro, id) => {
            this.setReadability(id, new_ro);
        });

        const mandChanges = Immutable.fromJS(data.mandatory_changes);
        mandChanges.forEach((new_mand, id) => {
            this.setFieldMandatory(id, new_mand);
        });

        if (data.dialog) {
            this.dialog = FrontendDialog.fromBackendData(data.dialog);
        } else {
            this.dialog = null;
        }

        this.wizardProgress = Immutable.fromJS(data.wizard_progress);
    }

    getOperationName() {
        return this.operationState.get('opname');
    }

    /**
     * Determine if the original change (disregarding changes from hooks that were
     * already executed) included the given fieldname.
     */
    isFieldChanged(fieldname) {
        return this.changes.has(fieldname);
    }

    /**
     * Check if a hook does apply to this change: the changed attribute name is
     * configured, or the hook applies to all changes.
     */
    isHookApplicable(hook) {
        const fieldname = hook.get('attribute');
        return fieldname === '*' || this.changes.has(fieldname);
    }

    /**
     * Returns the actual value of the dialog for the given fieldname.
     *
     * @param fieldname {string}
     */
    getValue(fieldname) {
        return this.newValues.get(fieldname);
    }

    /**
     * Set the value of the dialog for the given fieldname.
     *
     * @param fieldname {string}
     * @param value {string}
     */
    setValue(fieldname, value) {
        this.newValues = this.newValues.set(fieldname, value);
    }

    /**
     * Set the values of the dialog.
     *
     * @param values {Immutable.Map}
     */
    setValues(values) {
        this.newValues = this.newValues.merge(values);
    }

    /**
     * Get the values of the dialog.
     *
     * @param values {Immutable.Map}
     */
    getOldValue(fieldname) {
        return this.oldValues.get(fieldname);
    }

    /*
     * Finds all positions in a configured mask, where the given fieldname is rendered
     *
     * @param fieldname {string}
     * @param selector {string} - which attribute to compare
     */
    findFieldPaths(fieldname, selector) {
        return this.registers.flatMap((register, regIdx) =>
            register
                .get('fields')
                // map before filter to preserve original index values
                .map((field, fieldIdx) => [
                    field.get(selector),
                    fieldIdx,
                    field.get('multilang', Immutable.List()),
                ])
                .filter(
                    (path) =>
                        path[0] === fieldname ||
                        path[2].find((ml) => ml.get(selector) === fieldname)
                )
                .map((path) => {
                    const mlIdx = path[2].findIndex(
                        (ml) => ml.get(selector) === fieldname
                    );
                    return mlIdx !== -1
                        ? [regIdx, 'fields', path[1], 'multilang', mlIdx]
                        : [regIdx, 'fields', path[1]];
                })
        );
    }

    setFieldAttributes(fieldname, selector, attributes) {
        const paths = this.findFieldPaths(fieldname, selector);
        this.registers = this.registers.withMutations((regs) => {
            paths.forEach((path) => {
                regs.mergeIn(path, attributes);
            });
        });
    }

    setFieldMandatory(fieldname, value) {
        this.setFieldAttributes(fieldname, 'attribute', {mandatory: value});
        this.setFieldAttributes(fieldname, 'origin_attribute', {
            origin_mandatory: value,
        });
    }

    /**
     * Turns the field specified from the given fieldname into a mandatory
     * field on the dialog.
     *
     * @param fieldname {string}
     */
    setMandatory(fieldname) {
        this.setFieldMandatory(fieldname, true);
    }

    /**
     * Turns the field specified from the given fieldname into a optional
     * field on the dialog.
     *
     * @param fieldname {string}
     */
    setOptional(fieldname) {
        this.setFieldMandatory(fieldname, false);
    }

    setReadability(fieldname, value) {
        const paths = this.findFieldPaths(fieldname, 'attribute');
        const fields = paths.map((path) => this.registers.getIn(path));
        const specialReadOnlyFields = [
            fieldTypes.CALENDAR,
            fieldTypes.CATALOG,
            fieldTypes.COMBOBOX,
        ];
        const checkSpecialFieldAndOriginRO = (field) => {
            return (
                field.get('origin_readonly') !== 0 &&
                specialReadOnlyFields.includes(field.get('fieldtype'))
            );
        };
        // Are special field types and one of them is origin_readonly
        const is_origin_readonly = fields.find(checkSpecialFieldAndOriginRO);
        if (is_origin_readonly && value === 0) {
            this.setFieldAttributes(fieldname, 'attribute', {readonly: 2});
        } else {
            this.setFieldAttributes(fieldname, 'attribute', {readonly: value});
        }
    }

    /**
     * Turns the field specified from the given fieldname into a read only
     * field on the dialog.
     *
     * @param fieldname {string}
     */
    setReadOnly(fieldname) {
        this.setReadability(fieldname, 1);
    }

    /**
     * Turns the field specified from the given fieldname into a writeable
     * field on the dialog.
     *
     * @param fieldname {string}
     */
    setWriteable(fieldname) {
        this.setReadability(fieldname, 0);
    }

    /**
     * Manage flags that may prevent the "Submit" action of the dialog.
     */
    preventSubmit(reasonCode) {
        this.preventSubmitReasons = this.preventSubmitReasons.add(reasonCode);
    }

    allowSubmit(reasonCode) {
        this.preventSubmitReasons =
            this.preventSubmitReasons.delete(reasonCode);
    }
}

class PreSubmitHooksContext extends DialogHooksContext {
    constructor({
        operationState,
        currValues,
        oldValues,
        changes,
        registers,
        wizardProgress,
    }) {
        super({
            operationState,
            newValues: currValues,
            oldValues,
            changes,
            registers,
            preventSubmitReasons: Immutable.Set(),
            wizardProgress,
        });
        this.result = {
            errors: [],
        };
    }

    isHookApplicable(hook) {
        const fieldname = hook.get('attribute');
        return fieldname === '::PRE_SUBMIT::';
    }

    /**
     * Set an error message to display. All messages will be collected, and shown
     * to the user at the same time.
     */
    setError(title, message) {
        this.result.errors.push({title, message});
    }

    /**
     * Create a FrontendDialog instance that can be used by a hook function to
     * display a message or ask a question. The returned instance mut be supplied
     * to setDialog to be shown.
     */
    createDialog(title, text, argumentName) {
        return new FrontendDialog(title, text, argumentName);
    }

    /**
     * Show a dialog to the user. Only the last dialog set through this function
     * will have an effect!
     * TODO: maybe stop processing hooks, when the first dialog is shown?
     * Otherwise, decide how to handle multiple dialogs.
     *
     * @param {FrontendDialog} dialog The dialog to be shown
     */
    setDialog(dialog) {
        this.result.dialog = dialog;
    }

    /**
     * Replace a dialog.
     *
     * @param {FrontendDialog} dialog The dialog to be shown
     */
    setNextDialog(dialog, dialog_name, values) {
        this.result.next_dialog = dialog;
        const merged_values = values.merge(dialog.values);
        const op_state = Immutable.fromJS(
            this.result.next_dialog.operation_state
        );
        const type_dict = Immutable.Map(op_state.get('json_field_types', {}));
        const missing_attr = {};
        type_dict.map((v, attr) => {
            if (!merged_values.has(attr)) {
                missing_attr[attr] = '';
            }
            return null;
        });
        this.result.next_dialog.values = merged_values.merge(missing_attr);
        // Update wizard progress position if necessary
        let wizardProgress = this.wizardProgress;
        if (
            dialog.wizard_progress &&
            Object.keys(dialog.wizard_progress).length > 0
        ) {
            wizardProgress = Immutable.fromJS(dialog.wizard_progress);
        }
        const steps = wizardProgress.get('steps');
        if (steps) {
            const dialog_names = steps.map((step) => step.get('dialog_name'));
            const new_pos = dialog_names.indexOf(dialog_name);
            if (new_pos >= 0) {
                this.result.next_dialog.wizard_progress = wizardProgress.set(
                    'position',
                    new_pos
                );
                const button_label = steps.get(new_pos).get('button_label');
                if (button_label) {
                    this.result.next_dialog.wizard_progress =
                        this.result.next_dialog.wizard_progress.set(
                            'button_label',
                            button_label
                        );
                } else {
                    this.result.next_dialog.wizard_progress =
                        this.result.next_dialog.wizard_progress.remove(
                            'button_label'
                        );
                }
            }
        }
    }

    /**
     * Internal method: consume the backend's answer from calling hooks.
     */
    applyBackendResult(data) {
        this.setValues(data.new_values);
        data.errors.forEach((err) => this.setError(err.title, err.message));
        if (data.from_cdb_classification_hook) {
            const keys = Array.from(this.oldValues.keys());
            this.result.objectUnchanged = true;
            for (const k of keys) {
                // check if object will be modified (ignoring classification changes)
                if (
                    k !== 'cdb::argument.classification_web_ctrl' &&
                    this.oldValues[k] !== this.newValues[k]
                ) {
                    this.result.objectUnchanged = false;
                    break;
                }
            }
        }
        if (data.dialog) {
            this.setDialog(FrontendDialog.fromBackendData(data.dialog));
        }
        if (data.wizard_progress) {
            this.wizardProgress = Immutable.fromJS(data.wizard_progress);
            this.result.wizard_progress = this.wizardProgress;
        }
        if (data.next_dialog_link_data) {
            return postJSON(data.next_dialog_link_data.link, {
                wizard_progress: this.wizardProgress,
                obj_values: this.newValues,
                operation_state: this.operationState,
            }).then((next_dialog) =>
                this.setNextDialog(
                    next_dialog,
                    data.next_dialog_link_data.dialog_name,
                    this.newValues
                )
            );
        } else {
            this.result.newValues = data.new_values;
            return Promise.resolve();
        }
    }
}

function callBackendHooks(
    backendHookCfg,
    ctx,
    startBackendHooks,
    formStateSetter,
    displayErrors
) {
    const hook_ids = backendHookCfg
        .get('hooks')
        .filter((hook) => ctx.isHookApplicable(hook))
        .map((hook) => hook.get('hook_id'));
    if (hook_ids.size > 0) {
        // Call out to the backend if any BE-hook is defined. The BE will execute
        // all configured hooks, so that we don't need a round trip for each hook.
        const url = backendHookCfg.get('url');
        const request_data = ctx.getBackendRequestData(hook_ids);
        // Check if the BE hook is synchronus and set the field to readonly until
        // the hook is resolved
        const isSynchronous = backendHookCfg
            .get('hooks')
            .filter((hook) => hook_ids.includes(hook.get('hook_id')))
            .map((hook) => hook.get('synchronous'))
            .includes(1);
        startBackendHooks(isSynchronous); // Notify store that backend hooks are running
        postJSON(url, request_data).then(
            (data) => {
                // Revert the fields that were set to readonly once the backend hooks
                // are resolved
                ctx.applyBackendResult(data);
                formStateSetter(
                    ctx.newValues,
                    ctx.registers,
                    ctx.wizardProgress,
                    ctx.preventSubmitReasons
                );
                displayErrors(data.errors);
            },
            (error) => {
                error.response
                    .json()
                    .then((error) => {
                        displayErrors(
                            [error['error']],
                            /* dispatchEndBackendHooks = */ true
                        );
                    })
                    .catch(() => {
                        displayErrors(
                            [error],
                            /* dispatchEndBackendHooks = */ true
                        );
                    });
            }
        );
    }
}

function callFrontendHooks(dialogHooks, ctx) {
    // Call each hook function in the defined order. The values for the parameters
    // newValues, registers and preventSubmitReasons may be changed by the hooks,
    // and the hooks later in the chain receive these changed values.
    dialogHooks
        .filter((hook) => ctx.isHookApplicable(hook))
        .forEach((hook) => {
            const hookFunction = Registry.findDialogHook(
                hook.get('function_name')
            );
            if (hookFunction !== undefined) {
                hookFunction.call(undefined, ctx);
            }
            // TODO: log error if configured function is not found
        });
}

function callBackendPreSubmitHooks(backendHookCfg, ctx) {
    const hook_ids = backendHookCfg
        .get('hooks')
        .filter((hook) => ctx.isHookApplicable(hook))
        .map((hook) => hook.get('hook_id'));
    if (hook_ids.size === 0) {
        return Promise.resolve();
    } else {
        // Call out to the backend if any BE-hook is defined. The BE will execute
        // all configured hooks, so that we don't need a round trip for each hook.
        const url = backendHookCfg.get('url');
        const request_data = ctx.getBackendRequestData(hook_ids);
        return postJSON(url, request_data).then((data) =>
            ctx.applyBackendResult(data)
        );
    }
}

// ----------------------------------------------------------------------
// Entry points from the form change logic
// ----------------------------------------------------------------------

/**
 * ATTENTION: this is a preliminary API, and subject to change in future versions
 * of the product!
 *
 * Call the configured dialog hooks for a configured dialog.
 *
 * Besides dialogHooks and formStateSetter, the parameters of this function are
 * used to construct a DialogHooksContext object. That object provides the API
 * for the hook implementations, and manages the changed values and settings.
 *
 * @param  {Immutable.List} dialogHooks   List of dialog hooks to call, in the order
 *                                        as given in the list.
 * @param  {Immutable.Map} oldValues      Mask values before applying changes
 * @param  {Immutable.Map} changes        New values to set
 * @param  {Immutable.Map} operationState Current operation state from backend
 * @param  {Immutable.Map} newValues      Mask values after applying changes
 * @param  {Immutable.List} registers     Mask settings: list of registers, each
 *                                        containing a list of fields
 * @param  {Immutable.Set} preventSubmitReasons Set of strings: if at least one
 *                                        entry is in the set, the submit button
 *                                        of the form will be disabled. The hooks
 *                                        that set values, are also responsible for
 *                                        removing them, once the reason no longer
 *                                        applies.
 *  @param  {function} formStateSetter    Callback function that can be used by the
 *                                        async backend hooks to inject changes into
 *                                        the dialog.
 *  @param {function} displayErrors       Callback function that can be used to display errors
 *                                        received from async backend hooks.
 * @return object                         Potentially changed values and mask
 *                                        settings as an object with the keys
 *                                        "values", "registers" and "preventSubmitReasons".
 */
export function callDialogHooks(
    dialogHooks,
    {
        oldValues,
        changes,
        operationState,
        newValues,
        registers,
        preventSubmitReasons,
        wizardProgress,
    },
    startBackendHooks,
    formStateSetter,
    displayErrors
) {
    const ctx = new DialogHooksContext({
        oldValues,
        changes,
        operationState,
        newValues,
        registers,
        preventSubmitReasons,
        wizardProgress,
    });
    const frontendHooks = dialogHooks.get('frontend_hooks');
    if (frontendHooks !== undefined) {
        callFrontendHooks(frontendHooks, ctx);
    }
    const backendHooks = dialogHooks.get('backend_hooks');
    if (backendHooks !== undefined) {
        // Note: the BE call is asynchronuous, this means that the changes from
        // the BE will not be returned from callDialogHooks, but will be set when
        // the Web request returns.
        callBackendHooks(
            backendHooks,
            ctx,
            startBackendHooks,
            formStateSetter,
            displayErrors
        );
    }
    return {
        values: ctx.newValues,
        registers: ctx.registers,
        preventSubmitReasons: ctx.preventSubmitReasons,
        wizardProgress: ctx.wizardProgress,
        dialog: ctx.dialog,
    };
}

/**
 * The user has pressed "Submit", now run any configured hooks prior to actually
 * submitting the operation. Hooks can prevent the submit to proceed, or ask the
 * user a question about whether they actually want to submit, and/or present
 * some options for the user to choose from. The hooks can be defined either in
 * the frontend or backend.
 */
export function callPreSubmitHooks(
    dialogHooks,
    {currValues, oldValues, changes, registers, operationState, wizardProgress}
) {
    const ctx = new PreSubmitHooksContext({
        currValues,
        oldValues,
        changes,
        registers,
        operationState,
        wizardProgress,
    });
    const frontendHooks = dialogHooks.get('frontend_hooks');
    if (frontendHooks !== undefined) {
        callFrontendHooks(frontendHooks, ctx);
    }
    // Wrap the BE calls in a Promise, to allow the form to capture the eventually
    // available result from the BE hooks.
    let resultPromise;
    const backendHooks = dialogHooks.get('backend_hooks');
    if (backendHooks === undefined) {
        resultPromise = Promise.resolve();
    } else {
        resultPromise = callBackendPreSubmitHooks(backendHooks, ctx);
    }
    return resultPromise.then(() => {
        return ctx.result;
    });
}
