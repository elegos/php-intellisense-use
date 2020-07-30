# php-intellisense-use

This plugin automatically writes the use statements, hinting the developer for classes and methods via intellisense.

Supported OS:

- Linux
- Windows (untested)
- UNIX-like systems (like MacOS) (untested)

## Features

<!-- TODO: animations -->

- Classes and methods cache upon init
- Automatic use statements
  - Name collision detection
  - FQCN simplification
- Class name hinting across the workspace

### TODO

- Cache update upon save / delete
- Interfaces, Traits etc cache
- Methods hinting (using PHP and JS for current file?)
- Arguments hinting (class constructor)
- Arguments hinting (methods)
- Better algorithm to detect whether a class or a method has to be hinted (current status: first draft)

## Requirements

- PHP 7.1 + (tested with PHP 7.4.8). It is required to explore the PHP source files.

## Extension Settings

No settings for now.

<!--
Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.


For example:

This extension contributes the following settings:

* `myExtension.enable`: enable/disable this extension
* `myExtension.thing`: set to `blah` to do something

-->

## Known Issues

<!-- Calling out known issues can help limit users opening duplicate issues against your extension. -->

## Release Notes

<!-- Users appreciate release notes as you update your extension. -->

<!-- ### 1.0.0

Initial release of ... -->