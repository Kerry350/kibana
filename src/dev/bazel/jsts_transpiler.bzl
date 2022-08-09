"Simple wrapper over @babel/cli so we can quickly re-use the same configurations over packages"

load("@npm//@babel/cli:index.bzl", _babel = "babel")

def jsts_transpiler(name, srcs, build_pkg_name, web = False, root_input_dir = "", additional_args = ["--quiet"], **kwargs):
  """A macro around the autogenerated babel rule.

  Args:
    name: target name
    srcs: list of sources
    build_pkg_name: package name into the build folder
    web: setup the correct presets to consume the outputs in the browser, defaults to "False" and optimizes for node
    root_input_dir: defines the root input dir to transpile files from, defaults to "src"
    additional_args: Any additional extra arguments, defaults to --quiet
    **kwargs: the rest
  """

  inline_presets = [
    "--presets",
  ]

  if web:
    inline_presets += [
      "@kbn/babel-preset/webpack_preset",
    ]
  else:
    inline_presets += [
      "@kbn/babel-preset/node_preset",
    ]

  args = [
    "./%s/%s" % (build_pkg_name, root_input_dir),
    "--out-dir",
    "$(@D)",
    "--no-babelrc",
    "--extensions",
    ".ts,.tsx,.js",
  ] + inline_presets + additional_args

  data = srcs + [
    "//packages/kbn-babel-preset",
  ]

  _babel(
    name = name,
    data = data,
    output_dir = True,
    args = args,
    **kwargs
  )
