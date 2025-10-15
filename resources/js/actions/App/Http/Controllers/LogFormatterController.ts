import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\LogFormatterController::show
* @see app/Http/Controllers/LogFormatterController.php:10
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
* @see app/Http/Controllers/LogFormatterController.php:10
* @route '/'
*/
show.url = (options?: RouteQueryOptions) => {
    return show.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\LogFormatterController::show
* @see app/Http/Controllers/LogFormatterController.php:10
* @route '/'
*/
show.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\LogFormatterController::show
* @see app/Http/Controllers/LogFormatterController.php:10
* @route '/'
*/
show.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\LogFormatterController::show
* @see app/Http/Controllers/LogFormatterController.php:10
* @route '/'
*/
const showForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\LogFormatterController::show
* @see app/Http/Controllers/LogFormatterController.php:10
* @route '/'
*/
showForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\LogFormatterController::show
* @see app/Http/Controllers/LogFormatterController.php:10
* @route '/'
*/
showForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

show.form = showForm

/**
* @see \App\Http\Controllers\LogFormatterController::format
* @see app/Http/Controllers/LogFormatterController.php:15
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
* @see app/Http/Controllers/LogFormatterController.php:15
* @route '/format'
*/
format.url = (options?: RouteQueryOptions) => {
    return format.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\LogFormatterController::format
* @see app/Http/Controllers/LogFormatterController.php:15
* @route '/format'
*/
format.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: format.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\LogFormatterController::format
* @see app/Http/Controllers/LogFormatterController.php:15
* @route '/format'
*/
const formatForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: format.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\LogFormatterController::format
* @see app/Http/Controllers/LogFormatterController.php:15
* @route '/format'
*/
formatForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: format.url(options),
    method: 'post',
})

format.form = formatForm

const LogFormatterController = { show, format }

export default LogFormatterController