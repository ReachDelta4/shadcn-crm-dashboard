"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/mdast-util-newline-to-break@1.0.0";
exports.ids = ["vendor-chunks/mdast-util-newline-to-break@1.0.0"];
exports.modules = {

/***/ "(ssr)/./node_modules/.pnpm/mdast-util-newline-to-break@1.0.0/node_modules/mdast-util-newline-to-break/lib/index.js":
/*!********************************************************************************************************************!*\
  !*** ./node_modules/.pnpm/mdast-util-newline-to-break@1.0.0/node_modules/mdast-util-newline-to-break/lib/index.js ***!
  \********************************************************************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   newlineToBreak: () => (/* binding */ newlineToBreak)\n/* harmony export */ });\n/* harmony import */ var mdast_util_find_and_replace__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! mdast-util-find-and-replace */ \"(ssr)/./node_modules/.pnpm/mdast-util-find-and-replace@2.2.2/node_modules/mdast-util-find-and-replace/lib/index.js\");\n/**\n * @typedef {import('mdast').Content} Content\n * @typedef {import('mdast').Root} Root\n * @typedef {import('mdast-util-find-and-replace').ReplaceFunction} ReplaceFunction\n */\n\n/**\n * @typedef {Content | Root} Node\n */\n\n\n\n/**\n * Turn normal line endings into hard breaks.\n *\n * @param {Node} tree\n *   Tree to change.\n * @returns {void}\n *   Nothing.\n */\nfunction newlineToBreak(tree) {\n  (0,mdast_util_find_and_replace__WEBPACK_IMPORTED_MODULE_0__.findAndReplace)(tree, /\\r?\\n|\\r/g, replace)\n}\n\n/**\n * Replace line endings.\n *\n * @type {ReplaceFunction}\n */\nfunction replace() {\n  return {type: 'break'}\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi9ub2RlX21vZHVsZXMvLnBucG0vbWRhc3QtdXRpbC1uZXdsaW5lLXRvLWJyZWFrQDEuMC4wL25vZGVfbW9kdWxlcy9tZGFzdC11dGlsLW5ld2xpbmUtdG8tYnJlYWsvbGliL2luZGV4LmpzIiwibWFwcGluZ3MiOiI7Ozs7O0FBQUE7QUFDQSxhQUFhLHlCQUF5QjtBQUN0QyxhQUFhLHNCQUFzQjtBQUNuQyxhQUFhLHVEQUF1RDtBQUNwRTs7QUFFQTtBQUNBLGFBQWEsZ0JBQWdCO0FBQzdCOztBQUUwRDs7QUFFMUQ7QUFDQTtBQUNBO0FBQ0EsV0FBVyxNQUFNO0FBQ2pCO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDTztBQUNQLEVBQUUsMkVBQWM7QUFDaEI7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQSxVQUFVO0FBQ1YiLCJzb3VyY2VzIjpbIkQ6XFxEZWx0YSBJVlxcU29md2FyZXNcXGdsYXNzXFxzYW5kYm94XFxzaGFkY24tY3JtLWRhc2hib2FyZFxcbm9kZV9tb2R1bGVzXFwucG5wbVxcbWRhc3QtdXRpbC1uZXdsaW5lLXRvLWJyZWFrQDEuMC4wXFxub2RlX21vZHVsZXNcXG1kYXN0LXV0aWwtbmV3bGluZS10by1icmVha1xcbGliXFxpbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEB0eXBlZGVmIHtpbXBvcnQoJ21kYXN0JykuQ29udGVudH0gQ29udGVudFxuICogQHR5cGVkZWYge2ltcG9ydCgnbWRhc3QnKS5Sb290fSBSb290XG4gKiBAdHlwZWRlZiB7aW1wb3J0KCdtZGFzdC11dGlsLWZpbmQtYW5kLXJlcGxhY2UnKS5SZXBsYWNlRnVuY3Rpb259IFJlcGxhY2VGdW5jdGlvblxuICovXG5cbi8qKlxuICogQHR5cGVkZWYge0NvbnRlbnQgfCBSb290fSBOb2RlXG4gKi9cblxuaW1wb3J0IHtmaW5kQW5kUmVwbGFjZX0gZnJvbSAnbWRhc3QtdXRpbC1maW5kLWFuZC1yZXBsYWNlJ1xuXG4vKipcbiAqIFR1cm4gbm9ybWFsIGxpbmUgZW5kaW5ncyBpbnRvIGhhcmQgYnJlYWtzLlxuICpcbiAqIEBwYXJhbSB7Tm9kZX0gdHJlZVxuICogICBUcmVlIHRvIGNoYW5nZS5cbiAqIEByZXR1cm5zIHt2b2lkfVxuICogICBOb3RoaW5nLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbmV3bGluZVRvQnJlYWsodHJlZSkge1xuICBmaW5kQW5kUmVwbGFjZSh0cmVlLCAvXFxyP1xcbnxcXHIvZywgcmVwbGFjZSlcbn1cblxuLyoqXG4gKiBSZXBsYWNlIGxpbmUgZW5kaW5ncy5cbiAqXG4gKiBAdHlwZSB7UmVwbGFjZUZ1bmN0aW9ufVxuICovXG5mdW5jdGlvbiByZXBsYWNlKCkge1xuICByZXR1cm4ge3R5cGU6ICdicmVhayd9XG59XG4iXSwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbMF0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(ssr)/./node_modules/.pnpm/mdast-util-newline-to-break@1.0.0/node_modules/mdast-util-newline-to-break/lib/index.js\n");

/***/ })

};
;