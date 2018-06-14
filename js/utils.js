// This covers most of what people actually use jQuery for:

export function $(selector, scope = document) {
    return scope.querySelector(selector);
}

export function $$(selector, scope = document) {
    return scope.querySelectorAll(selector);
}

export default {$, $$};
