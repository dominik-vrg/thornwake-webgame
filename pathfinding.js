"use strict";

const DIAGONAL_COST = Math.SQRT2;
const NEIGHBOR_OFFSETS = [
    [1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, -1],
    [1, 1, DIAGONAL_COST], [1, -1, DIAGONAL_COST], [-1, 1, DIAGONAL_COST], [-1, -1, DIAGONAL_COST],
];

function octileDistance(c1, r1, c2, r2) {
    const dx = Math.abs(c1 - c2);
    const dy = Math.abs(r1 - r2);
    return (dx + dy) + (DIAGONAL_COST - 2) * Math.min(dx, dy);
}

function findPath(map, startCol, startRow, endCol, endRow, maxIterations = 2000) {
    if (!isWalkable(map, endCol, endRow)) return null;
    if (startCol === endCol && startRow === endRow) return [];

    const key = (c, r) => c + "," + r;

    const startNode = { c: startCol, r: startRow, g: 0, h: octileDistance(startCol, startRow, endCol, endRow), parent: null };
    startNode.f = startNode.h
    
    const open = [startNode];
    const openLookup = new Map([[key(startCol, startRow), startNode]]);
    const closed = new Set();

    let iterations = 0;
    while (open.length > 0){
        if (++iterations > maxIterations) return null;

        let bestIdx = 0;
        for (let i = 1; i < open.length; i++) {
            if (open[i].f < open[bestIdx].f) bestIdx = i;
        }
        const current = open.splice(bestIdx, 1)[0];
        openLookup.delete(key(current.c, current.r));
        closed.add(key(current.c, current.r));

        if (current.c === endCol && current.r === endRow) {
            const path = [];
            let n = current;
            while (n.parent) {
                path.push({ col: n.c, row: n.r });
                n = n.parent;
            }
            path.reverse();
            return path;
        }

        for (const [dc, dr, cost] of NEIGHBOR_OFFSETS) {
            const nc = current.c + dc, nr = current.r + dr;
            if (!isWalkable(map, nc, nr)) continue;
            if (dc !== 0 && dr !== 0) {
                if (!isWalkable(map, current.c + dc, current.r) || !isWalkable(map, current.c, current.r + dr)) continue;
            }
            const nk = key(nc, nr);
            if (closed.has(nk)) continue;

            const g = current.g + cost;
            let node = openLookup.get(nk);
            if (!node) {
                node = { c: nc, r: nr, g, h: octileDistance(nc, nr, endCol, endRow), parent: current };
                node.f = node.g + node.h;
                open.push(node);
                openLookup.set(nk, node);
            } else if (g < node.g) {
                node.g = g;
                node.f = g + node.h;
                node.parent = current;
            }
        }
    }

    return null;
}