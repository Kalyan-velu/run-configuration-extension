export const WORKSPACE_KEY_CONTEXT = 'CONFIG_KEY';
export const SELECTED_CONFIG_KEY = 'LAST_SELECTED_KEY';

export const unique_identifier = 'run-configuration';

export const RUN_CONFIG_COMMAND = `${unique_identifier}.run` as const;
export const SELECT_CONFIG_COMMAND = `${unique_identifier}.select` as const;
export const MANAGE_CONFIG_COMMAND = `${unique_identifier}.manage` as const;

export const CREATE_FROM_COMMAND = `${unique_identifier}.create.from` as const;
