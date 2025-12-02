class GodOrgError extends Error {
  constructor(message, status = 400) {
    super(message)
    this.name = "GodOrgError"
    this.status = status
  }
}

module.exports = {
  GodOrgError,
}
