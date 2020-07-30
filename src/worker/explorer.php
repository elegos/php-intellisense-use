<?php

function explore(string ...$paths) {
  ob_start();
  foreach ($paths as $path) {
    @require_once($path);
  }
  ob_end_clean();
  $classes = get_declared_classes();

  $result = [];

  foreach ($classes as $class) {
    $rc = new ReflectionClass($class);
    $docs = $rc->getDocComment() ?: '';
    $methodsRaw = $rc->getMethods(ReflectionMethod::IS_PUBLIC);
    $methods = [];
    foreach ($methodsRaw as $method) {
      $methods[] = [
        'name' => $method->name,
        'documentation' => $method->getDocComment() ?: '',
        'isAbstract' => $method->isAbstract(),
        'isConstructor' => $method->isConstructor(),
        'isDestructor' => $method->isDestructor(),
        'isFinal' => $method->isFinal(),
        'isPrivate' => $method->isPrivate(),
        'isProtected' => $method->isProtected(),
        'isPublic' => $method->isPublic(),
        'isStatic' => $method->isStatic(),
      ];
    }

    $result[] = [
      'fqcn' => $class,
      'documentation' => $docs,
      'methods' => $methods,
    ];
  }

  return json_encode($result);
}
