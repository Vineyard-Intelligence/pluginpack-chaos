# pluginpack-chaos

The **Chaos Reference Pack** for Vineyard — a bundle of six small graph-manipulation plugins used
for demos and validation. Installing the pack adds all six together.

| Plugin | Identifier | Effect |
| --- | --- | --- |
| Korean Roulette | `run.vineyard.plugins.korean_roulette` | Keeps one random node, deletes the rest |
| Russian Roulette | `run.vineyard.plugins.russian_roulette` | Deletes one random node + its edges |
| Thanos Snap | `run.vineyard.plugins.thanos_snap` | Deletes about half the nodes |
| Black Hole | `run.vineyard.plugins.black_hole` | Deletes a node's 1-hop neighbors |
| Dumb AI Optimizer | `run.vineyard.plugins.dumb_ai_optimizer` | Pretends to optimize; changes nothing |
| Schrödinger's Node | `run.vineyard.plugins.schrodingers_node` | Deletes a random node with 50% probability |

All six run in the browser sandbox, are `ephemeral` (no persistence), and request only graph
read/delete scopes.

## Layout

| Path | Purpose |
| --- | --- |
| `plugins/chaos-pack.manifest.json` | The Plugin Pack manifest (metadata + the six plugin definitions) |
| `dist/pack.mjs` | The runnable bundle |

## Listing / installing

Listed in the [registry](https://github.com/Vineyard-Intelligence/registry); browsable at
[docs.vineyard.run](https://docs.vineyard.run/).

## License

MIT
