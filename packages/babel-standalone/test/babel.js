const assert = require("assert");
const Babel = require("../babel");

// Basic smoke tests for babel-standalone
describe("babel-standalone", () => {
  it("handles the es2015-no-commonjs preset", () => {
    const output = Babel.transform('const getMessage = () => "Hello World"', {
      presets: ["es2015-no-commonjs"],
    }).code;
    assert.equal(
      output,
      "var getMessage = function getMessage() {\n" +
        '  return "Hello World";\n' +
        "};",
    );
  });

  it("can translate simple ast", () => {
    const ast = {
      type: "Program",
      start: 0,
      end: 2,
      directives: [],
      body: [
        {
          type: "ExpressionStatement",
          start: 0,
          end: 1,
          expression: {
            type: "NumericLiteral",
            start: 0,
            end: 2,
            value: 42,
            raw: "42",
          },
        },
      ],
      sourceType: "module",
    };
    const output = Babel.transformFromAst(ast, "42", { presets: ["es2015"] })
      .code;
    assert.equal(output, '"use strict";\n' + "\n" + "42;");
  });

  it("handles the react preset", () => {
    const output = Babel.transform(
      "const someDiv = <div>{getMessage()}</div>",
      {
        presets: ["react"],
      },
    ).code;
    assert.equal(
      output,
      'const someDiv = React.createElement("div", null, getMessage());',
    );
  });

  it("handles presets with options", () => {
    const output = Babel.transform("export let x", {
      presets: [["es2015", { modules: false }]],
    }).code;
    assert.equal(output, "export var x = void 0;");
  });

  it("handles specifying a plugin by name", () => {
    const output = Babel.transform('const getMessage = () => "Hello World"', {
      plugins: ["transform-es2015-arrow-functions"],
    }).code;
    // Transforms arrow syntax but NOT "const".
    assert.equal(
      output,
      "const getMessage = function () {\n" + '  return "Hello World";\n' + "};",
    );
  });

  it("handles plugins with options", () => {
    const output = Babel.transform("`${x}`", {
      plugins: [["transform-es2015-template-literals", { spec: true }]],
    }).code;
    assert.equal(
      output,
      '"".concat(x);', // https://github.com/babel/babel/pull/5791
    );
  });

  it("throws on invalid preset name", () => {
    assert.throws(
      () => Babel.transform("var foo", { presets: ["lolfail"] }),
      /Invalid preset specified in Babel options: "lolfail"/,
    );
  });

  it("throws on invalid plugin name", () => {
    assert.throws(
      () => Babel.transform("var foo", { plugins: ["lolfail"] }),
      /Invalid plugin specified in Babel options: "lolfail"/,
    );
  });

  describe("custom plugins and presets", () => {
    const lolizer = () => ({
      visitor: {
        Identifier(path) {
          path.node.name = "LOL";
        },
      },
    });

    it("allows custom plugins to be registered", () => {
      Babel.registerPlugin("lolizer", lolizer);
      const output = Babel.transform(
        "function helloWorld() { alert(hello); }",
        { plugins: ["lolizer"] },
      );
      assert.equal(
        output.code,
        `function LOL() {
  LOL(LOL);
}`,
      );
    });

    it("allows custom presets to be registered", () => {
      Babel.registerPreset("lulz", { plugins: [lolizer] });
      const output = Babel.transform(
        "function helloWorld() { alert(hello); }",
        { presets: ["lulz"] },
      );
      assert.equal(
        output.code,
        `function LOL() {
  LOL(LOL);
}`,
      );
    });
  });
});
