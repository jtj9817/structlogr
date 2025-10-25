import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../wayfinder'
/**
* @see \App\Http\Controllers\Settings\PreferencesController::show
* @see app/Http/Controllers/Settings/PreferencesController.php:12
* @route '/settings/preferences'
*/
export const show = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/settings/preferences',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Settings\PreferencesController::show
* @see app/Http/Controllers/Settings/PreferencesController.php:12
* @route '/settings/preferences'
*/
show.url = (options?: RouteQueryOptions) => {
    return show.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\PreferencesController::show
* @see app/Http/Controllers/Settings/PreferencesController.php:12
* @route '/settings/preferences'
*/
show.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Settings\PreferencesController::show
* @see app/Http/Controllers/Settings/PreferencesController.php:12
* @route '/settings/preferences'
*/
show.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Settings\PreferencesController::update
* @see app/Http/Controllers/Settings/PreferencesController.php:21
* @route '/settings/preferences'
*/
export const update = (options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(options),
    method: 'patch',
})

update.definition = {
    methods: ["patch"],
    url: '/settings/preferences',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\Settings\PreferencesController::update
* @see app/Http/Controllers/Settings/PreferencesController.php:21
* @route '/settings/preferences'
*/
update.url = (options?: RouteQueryOptions) => {
    return update.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\PreferencesController::update
* @see app/Http/Controllers/Settings/PreferencesController.php:21
* @route '/settings/preferences'
*/
update.patch = (options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(options),
    method: 'patch',
})

const preferences = {
    show: Object.assign(show, show),
    update: Object.assign(update, update),
}

export default preferences