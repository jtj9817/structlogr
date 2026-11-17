import {
    queryParams,
    type RouteDefinition,
    type RouteFormDefinition,
    type RouteQueryOptions,
} from './../../wayfinder';
/**
 * @see routes/web.php:9
 * @route '/designs'
 */
export const gallery = (
    options?: RouteQueryOptions,
): RouteDefinition<'get'> => ({
    url: gallery.url(options),
    method: 'get',
});

gallery.definition = {
    methods: ['get', 'head'],
    url: '/designs',
} satisfies RouteDefinition<['get', 'head']>;

/**
 * @see routes/web.php:9
 * @route '/designs'
 */
gallery.url = (options?: RouteQueryOptions) => {
    return gallery.definition.url + queryParams(options);
};

/**
 * @see routes/web.php:9
 * @route '/designs'
 */
gallery.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: gallery.url(options),
    method: 'get',
});

/**
 * @see routes/web.php:9
 * @route '/designs'
 */
gallery.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: gallery.url(options),
    method: 'head',
});

/**
 * @see routes/web.php:9
 * @route '/designs'
 */
const galleryForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: gallery.url(options),
    method: 'get',
});

/**
 * @see routes/web.php:9
 * @route '/designs'
 */
galleryForm.get = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: gallery.url(options),
    method: 'get',
});

/**
 * @see routes/web.php:9
 * @route '/designs'
 */
galleryForm.head = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: gallery.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        },
    }),
    method: 'get',
});

gallery.form = galleryForm;

const designs = {
    gallery: Object.assign(gallery, gallery),
};

export default designs;
