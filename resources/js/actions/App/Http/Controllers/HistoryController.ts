import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\HistoryController::index
* @see app/Http/Controllers/HistoryController.php:15
* @route '/history'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/history',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\HistoryController::index
* @see app/Http/Controllers/HistoryController.php:15
* @route '/history'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\HistoryController::index
* @see app/Http/Controllers/HistoryController.php:15
* @route '/history'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\HistoryController::index
* @see app/Http/Controllers/HistoryController.php:15
* @route '/history'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\HistoryController::index
* @see app/Http/Controllers/HistoryController.php:15
* @route '/history'
*/
const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\HistoryController::index
* @see app/Http/Controllers/HistoryController.php:15
* @route '/history'
*/
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\HistoryController::index
* @see app/Http/Controllers/HistoryController.php:15
* @route '/history'
*/
indexForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

index.form = indexForm

/**
* @see \App\Http\Controllers\HistoryController::exportMethod
* @see app/Http/Controllers/HistoryController.php:66
* @route '/history/export'
*/
export const exportMethod = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportMethod.url(options),
    method: 'get',
})

exportMethod.definition = {
    methods: ["get","head"],
    url: '/history/export',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\HistoryController::exportMethod
* @see app/Http/Controllers/HistoryController.php:66
* @route '/history/export'
*/
exportMethod.url = (options?: RouteQueryOptions) => {
    return exportMethod.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\HistoryController::exportMethod
* @see app/Http/Controllers/HistoryController.php:66
* @route '/history/export'
*/
exportMethod.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportMethod.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\HistoryController::exportMethod
* @see app/Http/Controllers/HistoryController.php:66
* @route '/history/export'
*/
exportMethod.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: exportMethod.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\HistoryController::exportMethod
* @see app/Http/Controllers/HistoryController.php:66
* @route '/history/export'
*/
const exportMethodForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: exportMethod.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\HistoryController::exportMethod
* @see app/Http/Controllers/HistoryController.php:66
* @route '/history/export'
*/
exportMethodForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: exportMethod.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\HistoryController::exportMethod
* @see app/Http/Controllers/HistoryController.php:66
* @route '/history/export'
*/
exportMethodForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: exportMethod.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

exportMethod.form = exportMethodForm

/**
* @see \App\Http\Controllers\HistoryController::show
* @see app/Http/Controllers/HistoryController.php:24
* @route '/history/{formattedLog}'
*/
export const show = (args: { formattedLog: string | number | { id: string | number } } | [formattedLog: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/history/{formattedLog}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\HistoryController::show
* @see app/Http/Controllers/HistoryController.php:24
* @route '/history/{formattedLog}'
*/
show.url = (args: { formattedLog: string | number | { id: string | number } } | [formattedLog: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { formattedLog: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { formattedLog: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            formattedLog: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        formattedLog: typeof args.formattedLog === 'object'
        ? args.formattedLog.id
        : args.formattedLog,
    }

    return show.definition.url
            .replace('{formattedLog}', parsedArgs.formattedLog.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\HistoryController::show
* @see app/Http/Controllers/HistoryController.php:24
* @route '/history/{formattedLog}'
*/
show.get = (args: { formattedLog: string | number | { id: string | number } } | [formattedLog: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\HistoryController::show
* @see app/Http/Controllers/HistoryController.php:24
* @route '/history/{formattedLog}'
*/
show.head = (args: { formattedLog: string | number | { id: string | number } } | [formattedLog: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\HistoryController::show
* @see app/Http/Controllers/HistoryController.php:24
* @route '/history/{formattedLog}'
*/
const showForm = (args: { formattedLog: string | number | { id: string | number } } | [formattedLog: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\HistoryController::show
* @see app/Http/Controllers/HistoryController.php:24
* @route '/history/{formattedLog}'
*/
showForm.get = (args: { formattedLog: string | number | { id: string | number } } | [formattedLog: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\HistoryController::show
* @see app/Http/Controllers/HistoryController.php:24
* @route '/history/{formattedLog}'
*/
showForm.head = (args: { formattedLog: string | number | { id: string | number } } | [formattedLog: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

show.form = showForm

/**
* @see \App\Http\Controllers\HistoryController::toggleSave
* @see app/Http/Controllers/HistoryController.php:45
* @route '/history/{formattedLog}/toggle-save'
*/
export const toggleSave = (args: { formattedLog: string | number | { id: string | number } } | [formattedLog: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: toggleSave.url(args, options),
    method: 'patch',
})

toggleSave.definition = {
    methods: ["patch"],
    url: '/history/{formattedLog}/toggle-save',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\HistoryController::toggleSave
* @see app/Http/Controllers/HistoryController.php:45
* @route '/history/{formattedLog}/toggle-save'
*/
toggleSave.url = (args: { formattedLog: string | number | { id: string | number } } | [formattedLog: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { formattedLog: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { formattedLog: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            formattedLog: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        formattedLog: typeof args.formattedLog === 'object'
        ? args.formattedLog.id
        : args.formattedLog,
    }

    return toggleSave.definition.url
            .replace('{formattedLog}', parsedArgs.formattedLog.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\HistoryController::toggleSave
* @see app/Http/Controllers/HistoryController.php:45
* @route '/history/{formattedLog}/toggle-save'
*/
toggleSave.patch = (args: { formattedLog: string | number | { id: string | number } } | [formattedLog: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: toggleSave.url(args, options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\HistoryController::toggleSave
* @see app/Http/Controllers/HistoryController.php:45
* @route '/history/{formattedLog}/toggle-save'
*/
const toggleSaveForm = (args: { formattedLog: string | number | { id: string | number } } | [formattedLog: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: toggleSave.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\HistoryController::toggleSave
* @see app/Http/Controllers/HistoryController.php:45
* @route '/history/{formattedLog}/toggle-save'
*/
toggleSaveForm.patch = (args: { formattedLog: string | number | { id: string | number } } | [formattedLog: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: toggleSave.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

toggleSave.form = toggleSaveForm

/**
* @see \App\Http\Controllers\HistoryController::destroy
* @see app/Http/Controllers/HistoryController.php:37
* @route '/history/{formattedLog}'
*/
export const destroy = (args: { formattedLog: string | number | { id: string | number } } | [formattedLog: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/history/{formattedLog}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\HistoryController::destroy
* @see app/Http/Controllers/HistoryController.php:37
* @route '/history/{formattedLog}'
*/
destroy.url = (args: { formattedLog: string | number | { id: string | number } } | [formattedLog: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { formattedLog: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { formattedLog: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            formattedLog: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        formattedLog: typeof args.formattedLog === 'object'
        ? args.formattedLog.id
        : args.formattedLog,
    }

    return destroy.definition.url
            .replace('{formattedLog}', parsedArgs.formattedLog.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\HistoryController::destroy
* @see app/Http/Controllers/HistoryController.php:37
* @route '/history/{formattedLog}'
*/
destroy.delete = (args: { formattedLog: string | number | { id: string | number } } | [formattedLog: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\HistoryController::destroy
* @see app/Http/Controllers/HistoryController.php:37
* @route '/history/{formattedLog}'
*/
const destroyForm = (args: { formattedLog: string | number | { id: string | number } } | [formattedLog: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\HistoryController::destroy
* @see app/Http/Controllers/HistoryController.php:37
* @route '/history/{formattedLog}'
*/
destroyForm.delete = (args: { formattedLog: string | number | { id: string | number } } | [formattedLog: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

destroy.form = destroyForm

/**
* @see \App\Http\Controllers\HistoryController::clear
* @see app/Http/Controllers/HistoryController.php:55
* @route '/history'
*/
export const clear = (options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: clear.url(options),
    method: 'delete',
})

clear.definition = {
    methods: ["delete"],
    url: '/history',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\HistoryController::clear
* @see app/Http/Controllers/HistoryController.php:55
* @route '/history'
*/
clear.url = (options?: RouteQueryOptions) => {
    return clear.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\HistoryController::clear
* @see app/Http/Controllers/HistoryController.php:55
* @route '/history'
*/
clear.delete = (options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: clear.url(options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\HistoryController::clear
* @see app/Http/Controllers/HistoryController.php:55
* @route '/history'
*/
const clearForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: clear.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\HistoryController::clear
* @see app/Http/Controllers/HistoryController.php:55
* @route '/history'
*/
clearForm.delete = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: clear.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

clear.form = clearForm

const HistoryController = { index, exportMethod, show, toggleSave, destroy, clear, export: exportMethod }

export default HistoryController