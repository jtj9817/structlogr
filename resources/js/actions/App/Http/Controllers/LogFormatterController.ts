import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\LogFormatterController::show
* @see app/Http/Controllers/LogFormatterController.php:13
* @route '/'
*/
export const show = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\LogFormatterController::show
* @see app/Http/Controllers/LogFormatterController.php:13
* @route '/'
*/
show.url = (options?: RouteQueryOptions) => {
    return show.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\LogFormatterController::show
* @see app/Http/Controllers/LogFormatterController.php:13
* @route '/'
*/
show.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\LogFormatterController::show
* @see app/Http/Controllers/LogFormatterController.php:13
* @route '/'
*/
show.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\LogFormatterController::format
* @see app/Http/Controllers/LogFormatterController.php:23
* @route '/format'
*/
export const format = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: format.url(options),
    method: 'post',
})

format.definition = {
    methods: ["post"],
    url: '/format',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\LogFormatterController::format
* @see app/Http/Controllers/LogFormatterController.php:23
* @route '/format'
*/
format.url = (options?: RouteQueryOptions) => {
    return format.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\LogFormatterController::format
* @see app/Http/Controllers/LogFormatterController.php:23
* @route '/format'
*/
format.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: format.url(options),
    method: 'post',
})

const LogFormatterController = { show, format }

export default LogFormatterController