/*
** Copyright (c) 2020, Oracle and/or its affiliates.
** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
*/
console.info('Loaded Network Security Group Javascript');

const network_security_group_query_cb = "network-security-group-query-cb";

/*
** Define Network Security Group Class
 */
class NetworkSecurityGroup extends OkitArtifact {
    /*
    ** Create
     */
    constructor (data={}, okitjson={}) {
        super(okitjson);
        // Configure default values
        this.display_name = this.generateDefaultName(okitjson.network_security_groups.length + 1);
        this.compartment_id = '';
        this.vcn_id = data.parent_id;
        this.security_rules = [];
        // Update with any passed data
        this.merge(data);
        this.convert();
    }


    /*
    ** Clone Functionality
     */
    clone() {
        return new NetworkSecurityGroup(this, this.getOkitJson());
    }


    /*
    ** Delete Processing
     */
    deleteChildren() {
        // Remove Instance vnic references
        for (let instance of this.getOkitJson().instances) {
            for (let vnic of instance.vnics) {
                for (let i = 0; i < vnic.nsg_ids.length; i++) {
                    if (vnic.nsg_ids[i] === this.id) {
                        vnic.nsg_ids.splice(i, 1);
                    }
                }
            }
        }
    }

    getNamePrefix() {
        return super.getNamePrefix() + 'nsg';
    }

    /*
    ** Static Functionality
     */
    static getArtifactReference() {
        return 'Network Security Group';
    }

}

$(document).ready(function() {
    // Setup Search Checkbox
    let body = d3.select('#query-progress-tbody');
    let row = body.append('tr');
    let cell = row.append('td');
    cell.append('input')
        .attr('type', 'checkbox')
        .attr('id', network_security_group_query_cb);
    cell.append('label').text(NetworkSecurityGroup.getArtifactReference());

    // Setup Query Display Form
    body = d3.select('#query-oci-tbody');
    row = body.append('tr');
    cell = row.append('td')
        .text(NetworkSecurityGroup.getArtifactReference());
    cell = row.append('td');
    let input = cell.append('input')
        .attr('type', 'text')
        .attr('class', 'query-filter')
        .attr('id', 'network_security_group_name_filter')
        .attr('name', 'network_security_group_name_filter');
});














