import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
/**
* @see routes/web.php:12
* @route '/debug/csrf-status'
*/
export const csrfStatus = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: csrfStatus.url(options),
    method: 'get',
})

csrfStatus.definition = {
    methods: ["get","head"],
    url: '/debug/csrf-status',
} satisfies RouteDefinition<["get","head"]>

/**
* @see routes/web.php:12
* @route '/debug/csrf-status'
*/
csrfStatus.url = (options?: RouteQueryOptions) => {
    return csrfStatus.definition.url + queryParams(options)
}

/**
* @see routes/web.php:12
* @route '/debug/csrf-status'
*/
csrfStatus.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: csrfStatus.url(options),
    method: 'get',
})

/**
* @see routes/web.php:12
* @route '/debug/csrf-status'
*/
csrfStatus.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: csrfStatus.url(options),
    method: 'head',
})

/**
* @see routes/web.php:12
* @route '/debug/csrf-status'
*/
const csrfStatusForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: csrfStatus.url(options),
    method: 'get',
})

/**
* @see routes/web.php:12
* @route '/debug/csrf-status'
*/
csrfStatusForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: csrfStatus.url(options),
    method: 'get',
})

/**
* @see routes/web.php:12
* @route '/debug/csrf-status'
*/
csrfStatusForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: csrfStatus.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

csrfStatus.form = csrfStatusForm

/**
* @see routes/web.php:24
* @route '/debug/csrf-test'
*/
export const csrfTest = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: csrfTest.url(options),
    method: 'post',
})

csrfTest.definition = {
    methods: ["post"],
    url: '/debug/csrf-test',
} satisfies RouteDefinition<["post"]>

/**
* @see routes/web.php:24
* @route '/debug/csrf-test'
*/
csrfTest.url = (options?: RouteQueryOptions) => {
    return csrfTest.definition.url + queryParams(options)
}

/**
* @see routes/web.php:24
* @route '/debug/csrf-test'
*/
csrfTest.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: csrfTest.url(options),
    method: 'post',
})

/**
* @see routes/web.php:24
* @route '/debug/csrf-test'
*/
const csrfTestForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: csrfTest.url(options),
    method: 'post',
})

/**
* @see routes/web.php:24
* @route '/debug/csrf-test'
*/
csrfTestForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: csrfTest.url(options),
    method: 'post',
})

csrfTest.form = csrfTestForm

/**
* @see routes/web.php:45
* @route '/debug/session-info'
*/
export const sessionInfo = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: sessionInfo.url(options),
    method: 'get',
})

sessionInfo.definition = {
    methods: ["get","head"],
    url: '/debug/session-info',
} satisfies RouteDefinition<["get","head"]>

/**
* @see routes/web.php:45
* @route '/debug/session-info'
*/
sessionInfo.url = (options?: RouteQueryOptions) => {
    return sessionInfo.definition.url + queryParams(options)
}

/**
* @see routes/web.php:45
* @route '/debug/session-info'
*/
sessionInfo.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: sessionInfo.url(options),
    method: 'get',
})

/**
* @see routes/web.php:45
* @route '/debug/session-info'
*/
sessionInfo.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: sessionInfo.url(options),
    method: 'head',
})

/**
* @see routes/web.php:45
* @route '/debug/session-info'
*/
const sessionInfoForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: sessionInfo.url(options),
    method: 'get',
})

/**
* @see routes/web.php:45
* @route '/debug/session-info'
*/
sessionInfoForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: sessionInfo.url(options),
    method: 'get',
})

/**
* @see routes/web.php:45
* @route '/debug/session-info'
*/
sessionInfoForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: sessionInfo.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

sessionInfo.form = sessionInfoForm

const debug = {
    csrfStatus: Object.assign(csrfStatus, csrfStatus),
    csrfTest: Object.assign(csrfTest, csrfTest),
    sessionInfo: Object.assign(sessionInfo, sessionInfo),
}

export default debug