import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../wayfinder'
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

const formatter = {
    format: Object.assign(format, format),
}

export default formatter