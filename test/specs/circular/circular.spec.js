"use strict";

const { expect } = require("chai");
const SwaggerParser = require("../../..");
const helper = require("../../utils/helper");
const path = require("../../utils/path");
const parsedSchema = require("./parsed");
const dereferencedSchema = require("./dereferenced");
const bundledSchema = require("./bundled");

describe("API with circular (recursive) $refs", () => {
  it("should parse successfully", () => {
    let parser = new SwaggerParser();
    return parser
      .parse(path.rel("specs/circular/circular.yaml"))
      .then(function (api) {
        expect(api).to.equal(parser.api);
        expect(api).to.deep.equal(parsedSchema.api);
        expect(parser.$refs.paths()).to.deep.equal([path.abs("specs/circular/circular.yaml")]);
      });
  });

  it("should resolve successfully", helper.testResolve(
    "specs/circular/circular.yaml", parsedSchema.api,
    "specs/circular/definitions/pet.yaml", parsedSchema.pet,
    "specs/circular/definitions/child.yaml", parsedSchema.child,
    "specs/circular/definitions/parent.yaml", parsedSchema.parent,
    "specs/circular/definitions/person.yaml", parsedSchema.person
  ));

  it("should dereference successfully", () => {
    let parser = new SwaggerParser();
    return parser
      .dereference(path.rel("specs/circular/circular.yaml"))
      .then(function (api) {
        expect(api).to.equal(parser.api);
        expect(api).to.deep.equal(dereferencedSchema);

        // Reference equality
        expect(api.definitions.person.properties.spouse).to.equal(api.definitions.person);
        expect(api.definitions.parent.properties.children.items).to.equal(api.definitions.child);
        expect(api.definitions.child.properties.parents.items).to.equal(api.definitions.parent);
      });
  });

  it("should validate successfully", () => {
    let parser = new SwaggerParser();
    return parser
      .validate(path.rel("specs/circular/circular.yaml"))
      .then(function (api) {
        expect(api).to.equal(parser.api);
        expect(api).to.deep.equal(helper.validated.circularExternal.fullyDereferenced);

        // Reference equality
        expect(api.definitions.person.properties.spouse).to.equal(api.definitions.person);
        expect(api.definitions.parent.properties.children.items).to.equal(api.definitions.child);
        expect(api.definitions.child.properties.parents.items).to.equal(api.definitions.parent);
      });
  });

  it('should not dereference circular $refs if "options.dereference.circular" is "ignore"', () => {
    let parser = new SwaggerParser();
    return parser
      .validate(path.rel("specs/circular/circular.yaml"), { dereference: { circular: "ignore" }})
      .then(function (api) {
        expect(api).to.equal(parser.api);
        expect(api).to.deep.equal(helper.validated.circularExternal.ignoreCircular$Refs);

        // Reference equality
        expect(api.paths["/pet"].get.responses["200"].schema).to.equal(api.definitions.pet);
      });
  });

  it('should fail validation if "options.dereference.circular" is false', () => {
    let parser = new SwaggerParser();
    return parser
      .validate(path.rel("specs/circular/circular.yaml"), { dereference: { circular: false }})
      .then(helper.shouldNotGetCalled)
      .catch(function (err) {
        expect(err).to.be.an.instanceOf(ReferenceError);
        expect(err.message).to.equal("The API contains circular references");
      });
  });

  it("should bundle successfully", () => {
    let parser = new SwaggerParser();
    return parser
      .bundle(path.rel("specs/circular/circular.yaml"))
      .then(function (api) {
        expect(api).to.equal(parser.api);
        expect(api).to.deep.equal(bundledSchema);
      });
  });
});
