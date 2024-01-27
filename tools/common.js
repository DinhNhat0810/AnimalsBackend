const { isValidObjectId } = require("mongoose");

function isNonEmptyArray(arr) {
  return Array.isArray(arr) && arr?.length > 0;
}

function isNonEmptyValidObjectId(value) {
  return (
    typeof value === "string" && value.trim() !== "" && isValidObjectId(value)
  );
}

function isNonEmptyArrayWithValidObjectId(arr) {
  return isNonEmptyArray(arr) && arr.every(isNonEmptyValidObjectId);
}

function removeDuplicateElements(arr) {
  return Array.from(new Set(arr));
}

module.exports = {
  isNonEmptyArray,
  isNonEmptyValidObjectId,
  isNonEmptyArrayWithValidObjectId,
  removeDuplicateElements,
};
