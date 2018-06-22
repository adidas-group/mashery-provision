const client = require('../client')
const spinner = require('../utils/spinner')
const makeBlueprintParser = require('./adidas/makeBlueprintParser')
const packagePropTypes = require('./adidas/utils/packageBlueprintPropTypes')
const parseBlueprintValues = require('./adidas/utils/packageBlueprintPropTypes')
const makePackageFromBlueprint = require('./adidas/resolvePackageBlueprint')

const confirmChanges = require('../utils/confirmChanges')

const loadBlueprint = makeBlueprintParser(packagePropTypes)

function syncBlueprintPackage (blueprintPath, options) {
  const blueprintValues = parseBlueprintValues(options.set)

  console.log(`Creating package from blueprint file '${blueprintPath}'`)
  spinner.start()

  loadBlueprint(blueprintPath, blueprintValues)
    .then(makePackageFromBlueprint)
    .then(packageData => {
      spinner.stop()

      if (packageData.package.id) {
        updatePackage(packageData)
      } else {
        createPackage(packageData)
      }
    })
}

function updatePackage (packageData) {
  return confirmChanges({
    before: packageData.persisted,
    after: packageData.package,
    message: 'Is this valid update of package?',
    action: updatedData => {
      spinner.start()
      return client.updatePackage(packageData.package.id, updatedData)
    }
  })
    .then(updatedPackage => {
      spinner.stop()
      console.log(
        `Package updated. https://adidas.admin.mashery.com/control-center/api-packages/${
          updatedPackage.id
        }`
      )
    })
    .catch(error => {
      console.error('Updating failed:')
      console.error(error)
    })
}

function createPackage (packageData) {
  return confirmChanges({
    before: {},
    after: packageData.package,
    message: 'Is this valid structure of new package?',
    action: newData => {
      spinner.start()
      return client.createPackage(newData)
    }
  })
    .then(newPackage => {
      spinner.stop()
      console.log(
        `Package created. https://adidas.admin.mashery.com/control-center/api-packages/${
          newPackage.id
        }`
      )
    })
    .catch(error => {
      console.error('Creating failed:')
      console.error(error)
    })
}

module.exports = syncBlueprintPackage
