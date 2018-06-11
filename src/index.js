import React, { Component } from 'react';
import * as d3 from 'd3'
export class Vec {
    constructor(x = 0, y = 0) {
        this.x = x
        this.y = y
        return this
    }
    to(angle, velocity) {
        this.x = Math.cos(angle) * velocity
        this.y = Math.sin(angle) * velocity
        return this
    }
    angleTo(vec){
        return Math.atan2(
            vec.y - this.y,
            vec.x - this.x
        )
    }
    sum(vec) {
        this.x += vec.x
        this.y += vec.y
        return this
    }
    mul(value) {
        this.x *= value
        this.y *= value
        return this
    }
    sub(vec) {
        this.x *= vec.x
        this.y *= vec.y
        return this
    }
    dist(vec) {
        const catA = (vec.y - this.y)
        const catB = (vec.x - this.x)
        return Math.round(Math.pow((catA * catA + catB * catB), 0.5))
    }
}
export class Graph extends Component {
    getId(name) {
        return name.replace(' ', '')
    }
    addNodes(nodes, connections) {
        // CONNECTIONS
        d3.select(this.canvas).selectAll('.connection').remove()
        d3.select(this.canvas).selectAll('.node').remove()
        const gcon = d3.select(this.canvas).selectAll('.connection')
            .data(connections).enter()
            .append('g')
            .attr('class', 'connection')
        gcon
            .append('svg:line')
            .attr('x1', d => d.InstanceNodeA.x)
            .attr('y1', d => d.InstanceNodeA.y)
            .attr('x2', d => d.InstanceNodeB.x)
            .attr('y2', d => d.InstanceNodeB.y)
            .attr('stroke', '#000000')
        gcon.append('svg:text')
            .text(d => d.weight)
            .attr('dx', d => d.InstanceNodeA.x + (d.InstanceNodeB.x - d.InstanceNodeA.x) / 2)
            .attr('dy', d => d.InstanceNodeA.y + (d.InstanceNodeB.y - d.InstanceNodeA.y) / 2)

        // NODES

        const g = d3.select(this.canvas).selectAll('.node')
            .data(nodes).enter()
            .append('g')
            .attr('class', 'node')
            .attr('transform', d => `translate(${d.x}, ${d.y})`)
            .on("contextmenu", (d) => {
                d3.event.preventDefault();
                d.fixed = !d.fixed
                return false
            })    
            .call(d3.drag()
                .on("start", (d, i, node) => {
                    d.moving = true
                })
                .on("drag", (d, i, node) => {
                    d.x = d3.event.x
                    d.y = d3.event.y
                })
                .on("end", (d, i, node) => {
                    delete (d.moving)
                }));


        g.append('svg:text')

            .text(d => d.name)
            .each((d, i, node) => {
                d.width = node[i].getComputedTextLength()
            })
            .attr('dx', d => -d.width / 2)
            .attr('dy', 10)
            .attr('z-order', -999)
        g.append("svg:rect")
            .attr("rx", 6)
            .attr("ry", 6)
            .attr('x', d => -d.width / 2 - 5)
            .attr('y', d => - 10)
            .attr("width", d => d.width + 10)
            .attr("height", 25)
            .attr('fill', '#CCCC22')
            .attr('stroke', '#000000')
            .each((d, i, nodos) => {
                var firstChild = nodos[i].parentNode.firstChild;
                if (firstChild) {
                    nodos[i].parentNode.insertBefore(nodos[i], firstChild);
                }
            })
        return g;
    }
    sizeOf(el) {
        let box = el.getBoundingClientRect();
        return new Vec(box.right - box.left, box.bottom - box.top)
    }
    outBox(node) {
        return node.x <= 0
            || node.y <= 0
            || node.x >= this.sizeOf(this.canvas).x
            || node.y >= this.sizeOf(this.canvas).y
    }
    move(node, vec) {
        if (node.fixed || node.moving) return
        let _vec = new Vec(vec.x, vec.y)
        if (this.outBox(node)) {
            const angle = Math.atan2(
                (this.sizeOf(this.canvas).x) / 2 - node.y,
                (this.sizeOf(this.canvas).y) / 2 - node.x,
            )
            _vec.sum(new Vec().to(angle, 5))
        }
        node.x += Math.round(_vec.x)
        node.y += Math.round(_vec.y)
    }
    updateNodesPositions(){
        
    }
    componentDidUpdate() {
        let { nodes = [], connections = [], scale = 1 } = this.props
        connections = connections.map(c => (
            {
                ...c,
                InstanceNodeA: nodes.find(t => t.name === c.nodeA),
                InstanceNodeB: nodes.find(t => t.name === c.nodeB)
            }
        ))
        this.addNodes(nodes, connections)
        if (this.timer) {
            this.timer.stop()
        }
        this.timer = d3.timer((elapsedTime) => {
            // Run ajusts
            connections = connections.map(con => {
                const { InstanceNodeA, InstanceNodeB, weight } = con;
                const dist = new Vec(InstanceNodeA.x, InstanceNodeA.y).dist(new Vec(InstanceNodeB.x, InstanceNodeB.y))
                const angle = new Vec(InstanceNodeA.x, InstanceNodeA.y).angleTo(InstanceNodeB)
                const ScaledWeight = weight * (scale / 10)
                let vel = Math.abs((dist - ScaledWeight)) * 0.02
                let vec = new Vec().to(angle, vel)
                if (dist > ScaledWeight) {
                    // let t = nodes.reduce((current, n) => {
                    //     let _vec = new Vec(n.x, n.y)
                    //     return _vec.dist(InstanceNodeA) > 50 ? 
                    //     current : 
                    //     current.sum(new Vec().to(new Vec(InstanceNodeA.x, InstanceNodeA.y).angleTo(_vec),5));
                    // }, new Vec(vec.x, vec.y))
                    this.move(con.InstanceNodeA, vec)
                    this.move(con.InstanceNodeB, vec.mul(-1))
                }
                if (dist < ScaledWeight) {
                    this.move(con.InstanceNodeB, vec)
                    this.move(con.InstanceNodeA, vec.mul(-1))
                }
                return con;
            })
            // Update Nodes

            d3.select(this.canvas).selectAll('.node')
                .data(nodes)
                .attr('transform', d => `translate(${d.x}, ${d.y})`)
                .select('rect').attr('fill', d => d.fixed ? '#CC2222' : d.moving?'#22CC22':'#CCCC22')
            d3.select(this.canvas).selectAll('.connection')
                .data(connections)
                .selectAll('line')
                .attr('stroke', d => d.InstanceNodeA.moving || d.InstanceNodeB.moving ? '#22CC22' : '#000000')
                .attr('stroke-width', d => d.InstanceNodeA.moving || d.InstanceNodeB.moving ? 2 : 1)
                .attr('x1', d => d.InstanceNodeA.x)
                .attr('y1', d => d.InstanceNodeA.y)
                .attr('x2', d => d.InstanceNodeB.x)
                .attr('y2', d => d.InstanceNodeB.y)
            d3.select(this.canvas).selectAll('.connection')
                .data(connections)
                .selectAll('text')
                .attr('stroke', d => d.InstanceNodeA.moving || d.InstanceNodeB.moving ? '#22CC22' : '#999999')
                .attr('dx', d => d.InstanceNodeA.x + (d.InstanceNodeB.x - d.InstanceNodeA.x) / 2)
                .attr('dy', d => d.InstanceNodeA.y + (d.InstanceNodeB.y - d.InstanceNodeA.y) / 2)


        }, 1000, 30)
    }
    componentWillUnmount() {
        this.timer.stop()
    }
    render() {
        return <svg ref={el => this.canvas = el} width='100%' height='100%' >

        </svg>
    }
}
