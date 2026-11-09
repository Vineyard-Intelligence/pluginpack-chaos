// ONE file, MANY plugins — a plugin pack (the analog of a typepack carrying many types).
// `definePluginPack` lets a single bundle ship multiple plugins; the loader flattens them.
import { definePlugin, definePluginPack } from './sdk';

const koreanRoulette = definePlugin({
    manifest: {
        identifier: 'run.vineyard.plugins.korean_roulette',
        content_type: 'vineyard:plugin',
        name: 'Korean Roulette',
        version: '1.0.0',
        description: 'Randomly keeps just one node and deletes every other node and edge in the graph.',
        icon: 'skull',
        platforms: { primary: 'web', web: { runtime: 'sandbox-js', entry: 'dist/pack.mjs' } },
        io: { consumes: [], produces: [] },
        scopes: { graph: ['node:read', 'node:delete', 'edge:read', 'edge:delete'] },
        lifecycle: { persistence: 'ephemeral', controls: ['progress', 'cancel'], progress: 'indeterminate' },
    },
    async run(ctx) {
        const { nodes } = await ctx.graph!.list!();
        if (nodes.length <= 1) return { summary: '1 or fewer nodes — no change', counts: { deleted: 0 } };
        const survivor = nodes[Math.floor(Math.random() * nodes.length)];
        const doomed = nodes.flatMap((n) => (n.id !== survivor.id ? [n.id] : []));
        ctx.progress?.set?.({ message: `Survivor: ${survivor.id}` });
        const edges = await ctx.graph!.edges!();
        if (edges.length) await ctx.graph!.deleteEdges!(edges.map((e) => e.id));
        await ctx.graph!.deleteNodes!(doomed);
        return { summary: `1 node survived, ${doomed.length} deleted`, counts: { deleted: doomed.length } };
    },
});

const russianRoulette = definePlugin({
    manifest: {
        identifier: 'run.vineyard.plugins.russian_roulette',
        content_type: 'vineyard:plugin',
        name: 'Russian Roulette',
        version: '1.0.0',
        description: 'Deletes one random node and its connected edges. Everything else is kept.',
        icon: 'target',
        platforms: { primary: 'web', web: { runtime: 'sandbox-js', entry: 'dist/pack.mjs' } },
        io: { consumes: [], produces: [] },
        scopes: { graph: ['node:read', 'node:delete', 'edge:read', 'edge:delete'] },
        lifecycle: { persistence: 'ephemeral', controls: ['cancel'] },
    },
    async run(ctx) {
        const { nodes } = await ctx.graph!.list!();
        if (!nodes.length) return { summary: 'No nodes', counts: { deleted: 0, edges: 0 } };
        const victim = nodes[Math.floor(Math.random() * nodes.length)];
        const edges = await ctx.graph!.edges!();
        const incident = edges.filter((e) => e.from_node_id === victim.id || e.to_node_id === victim.id);
        if (incident.length) await ctx.graph!.deleteEdges!(incident.map((e) => e.id));
        await ctx.graph!.deleteNode!(victim.id);
        return { summary: `Deleted node ${victim.id}`, counts: { deleted: 1, edges: incident.length } };
    },
});

const thanosSnap = definePlugin({
    manifest: {
        identifier: 'run.vineyard.plugins.thanos_snap',
        content_type: 'vineyard:plugin',
        name: 'Thanos Snap',
        version: '1.0.0',
        description: 'Randomly deletes about half (floor(n/2)) of the nodes. Surviving nodes keep their relationships.',
        icon: 'hand-sparkles',
        platforms: { primary: 'web', web: { runtime: 'sandbox-js', entry: 'dist/pack.mjs' } },
        io: { consumes: [], produces: [] },
        scopes: { graph: ['node:read', 'node:delete', 'edge:read', 'edge:delete'] },
        lifecycle: { persistence: 'ephemeral', controls: ['progress', 'cancel'], progress: 'determinate' },
    },
    async run(ctx) {
        const { nodes } = await ctx.graph!.list!();
        const k = Math.floor(nodes.length / 2);
        if (k === 0) return { summary: 'No nodes to delete', counts: { deleted: 0 } };
        const arr = [...nodes];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        const doomedIds = new Set(arr.slice(0, k).map((n) => n.id));
        ctx.progress?.set?.({ percent: 30, message: `Selected ${k}` });
        const edges = await ctx.graph!.edges!();
        const incident = edges.filter((e) => doomedIds.has(e.from_node_id) || doomedIds.has(e.to_node_id));
        if (incident.length) await ctx.graph!.deleteEdges!(incident.map((e) => e.id));
        ctx.progress?.set?.({ percent: 70, message: 'Deleting nodes' });
        await ctx.graph!.deleteNodes!([...doomedIds]);
        ctx.progress?.set?.({ percent: 100 });
        return { summary: `${k}/${nodes.length} nodes erased`, counts: { deleted: k } };
    },
});

const blackHole = definePlugin({
    manifest: {
        identifier: 'run.vineyard.plugins.black_hole',
        content_type: 'vineyard:plugin',
        name: 'Black Hole',
        version: '1.0.0',
        description:
            'Deletes all directly connected (1-hop) neighbors of the selected base node. The base node is kept.',
        icon: 'circle-dot',
        platforms: { primary: 'web', web: { runtime: 'sandbox-js', entry: 'dist/pack.mjs' } },
        io: { consumes: [], produces: [] },
        scopes: { graph: ['node:read', 'node:delete', 'edge:read', 'edge:delete'] },
        lifecycle: { persistence: 'ephemeral', controls: ['cancel'] },
    },
    async run(ctx) {
        const baseId = ctx.input.selection[0];
        if (!baseId) return { summary: 'Select a base node first', counts: { deleted: 0 } };
        const { nodes, edges } = await ctx.graph!.neighbors!(baseId);
        if (!nodes.length) return { summary: 'No neighbors — no change', counts: { deleted: 0 } };
        if (edges.length) await ctx.graph!.deleteEdges!(edges.map((e) => e.id));
        await ctx.graph!.deleteNodes!(nodes.map((n) => n.id));
        return { summary: `Absorbed ${nodes.length} neighbor(s)`, counts: { deleted: nodes.length } };
    },
});

const dumbAiOptimizer = definePlugin({
    manifest: {
        identifier: 'run.vineyard.plugins.dumb_ai_optimizer',
        content_type: 'vineyard:plugin',
        name: 'Dumb AI Optimizer',
        version: '1.0.0',
        description:
            'Shows an “AI is optimizing the graph…” progress bar, then claims “Optimization complete” — but actually changes nothing.',
        icon: 'sparkles',
        platforms: { primary: 'web', web: { runtime: 'sandbox-js', entry: 'dist/pack.mjs' } },
        io: { consumes: [], produces: [] },
        scopes: {}, // no authority at all — the scope-0 case must work
        lifecycle: { persistence: 'ephemeral', controls: ['progress', 'cancel'], progress: 'determinate' },
    },
    async run(ctx) {
        const sleep = (ms: number) =>
            new Promise<void>((resolve, reject) => {
                const t = setTimeout(resolve, ms);
                ctx.signal?.addEventListener('abort', () => {
                    clearTimeout(t);
                    reject(new DOMException('aborted', 'AbortError'));
                });
            });
        const total = 16;
        for (let i = 1; i <= total; i++) {
            await sleep(250);
            ctx.progress?.set?.({ percent: Math.round((i / total) * 100), message: 'AI is optimizing the graph…' });
        }
        return { summary: 'Optimization complete (nothing actually changed 🙃)', counts: { changed: 0 } };
    },
});

const schrodingersNode = definePlugin({
    manifest: {
        identifier: 'run.vineyard.plugins.schrodingers_node',
        content_type: 'vineyard:plugin',
        name: "Schrödinger's Node",
        version: '1.0.0',
        description: 'Picks one random node and deletes it with 50% probability, or does nothing with 50% probability.',
        icon: 'box',
        platforms: { primary: 'web', web: { runtime: 'sandbox-js', entry: 'dist/pack.mjs' } },
        io: { consumes: [], produces: [] },
        scopes: { graph: ['node:read', 'node:delete', 'edge:read', 'edge:delete'] },
        lifecycle: { persistence: 'ephemeral', controls: ['cancel'] },
    },
    async run(ctx) {
        const { nodes } = await ctx.graph!.list!();
        if (!nodes.length) return { summary: 'No nodes', counts: { deleted: 0 } };
        const node = nodes[Math.floor(Math.random() * nodes.length)];
        if (Math.random() >= 0.5) return { summary: `Observation: ${node.id} survived`, counts: { deleted: 0 } };
        const edges = await ctx.graph!.edges!();
        const incident = edges.filter((e) => e.from_node_id === node.id || e.to_node_id === node.id);
        if (incident.length) await ctx.graph!.deleteEdges!(incident.map((e) => e.id));
        await ctx.graph!.deleteNode!(node.id);
        return { summary: `Observation: ${node.id} collapsed (deleted)`, counts: { deleted: 1 } };
    },
});

// The pack's page in the marketplace drawer, in Markdown. One entry per line so that backticks and
// quotes in the Markdown need no template-literal escaping.
const DESCRIPTION = [
    'A reference pack of six small plugins that change the graph in obvious ways, most of them by deleting things at random. It exists for demonstrating and validating the plugin system: several plugins in one bundle, progress and cancel controls, graph read and delete scopes, and a plugin that requests no scopes at all. It has no investigative use.',
    '',
    'Five of the six delete nodes and edges from the open project. The pack is meant for a throwaway project.',
    '',
    '## Plugins',
    '',
    '| Plugin | Acts on | Effect |',
    '| --- | --- | --- |',
    '| Korean Roulette | the whole graph | Keeps one node chosen at random and deletes every other node and every edge. No change when the graph has one node or none. |',
    '| Russian Roulette | the whole graph | Deletes one random node and the edges connected to it. Everything else is kept. |',
    '| Thanos Snap | the whole graph | Deletes floor(n/2) randomly chosen nodes and their edges. Edges between surviving nodes are kept. |',
    '| Black Hole | the first selected node | Deletes every node directly connected to it, and the edges linking them. The selected node is kept. |',
    '| Dumb AI Optimizer | nothing | Shows an "AI is optimizing the graph…" progress bar for about four seconds, then reports "Optimization complete". Requests no scopes and changes nothing. |',
    "| Schrödinger's Node | the whole graph | Picks one random node and, with 50% probability, deletes it and its edges; otherwise leaves it. |",
    '',
    'Except for Black Hole, the plugins ignore the selection. Choices are random on every run, so results cannot be reproduced. Every plugin can be cancelled; Korean Roulette, Thanos Snap and Dumb AI Optimizer also report progress. No plugin creates or edits nodes.',
    '',
    '## Requirements',
    '',
    'None. No API key, no type pack, no desktop app. The plugins run in the browser sandbox. Five request the graph scopes `node:read`, `node:delete`, `edge:read` and `edge:delete`; Dumb AI Optimizer requests none.',
    '',
    '## What it contacts',
    '',
    'Nothing. No plugin in the pack has a network scope.',
    '',
    '## Source',
    '',
    'https://github.com/Vineyard-Intelligence/pluginpack-chaos (MIT)',
    '',
    '`node build.mjs` rebuilds `dist/pack.mjs` from `src/` with a pinned esbuild.',

].join('\n');

// The pack — one file, six plugins.
export default definePluginPack({
    identifier: 'run.vineyard.pluginpacks.chaos',
    content_type: 'vineyard:pluginpack',
    name: 'Chaos Reference Pack',
    version: '1.1.0',
    summary: 'Six graph-manipulation plugins for demos and validation.',
    description: DESCRIPTION,
    plugins: [koreanRoulette, russianRoulette, thanosSnap, blackHole, dumbAiOptimizer, schrodingersNode],
});
