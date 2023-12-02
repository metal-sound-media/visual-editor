<?php
require_once __DIR__ . '/../vendor/autoload.php';

class PrefixStrippingLoader extends \Twig\Loader\FilesystemLoader
{
    private function strip(string $name): string
    {
        return preg_replace('#^visual-editor/article/#', '', $name);
    }

    public function getSourceContext(string $name): \Twig\Source
    {
        return parent::getSourceContext($this->strip($name));
    }

    public function exists(string $name): bool
    {
        return parent::exists($this->strip($name));
    }

    public function getCacheKey(string $name): string
    {
        return parent::getCacheKey($this->strip($name));
    }

    public function isFresh(string $name, int $time): bool
    {
        return parent::isFresh($this->strip($name), $time);
    }
}

function createTwigEnv(): \Twig\Environment
{
    $loader = new PrefixStrippingLoader(dirname(__DIR__) . '/templates');
    $twig   = new \Twig\Environment($loader);
    $twig->addFunction(new \Twig\TwigFunction('cdn',        fn($url, $opts = []) => $url));
    $twig->addFunction(new \Twig\TwigFunction('get_height', fn($img, $w)         => ''));
    $twig->addFunction(new \Twig\TwigFunction('asset',      fn($path)            => $path));
    return $twig;
}

function renderBlockTwig(\Twig\Environment $twig, array $data): void
{
    $name = preg_replace('/[^a-z0-9\-]/', '', (string)($data['_name'] ?? ''));
    $tpl  = '_' . $name . '.html.twig';
    if (!file_exists(dirname(__DIR__) . '/templates/' . $tpl)) {
        echo "<div style='padding:1rem;color:red'>Template manquant : " . htmlspecialchars($name) . "</div>";
        return;
    }
    echo $twig->render($tpl, ['block' => $data, 'preview' => true]);
}
