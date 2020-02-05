/*
** Copyright © 2020, Oracle and/or its affiliates. All rights reserved.
** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
*/
console.info('Loaded Block Storage Volume Javascript');

/*
** Set Valid drop Targets
 */
asset_drop_targets[block_storage_volume_artifact] = [compartment_artifact];

const block_storage_volume_query_cb = "block-storage-volume-query-cb";

/*
** Define Block Storage Volume Class
 */
class BlockStorageVolume extends OkitArtifact {
    /*
    ** Create
     */
    constructor (data={}, okitjson={}, parent=null) {
        super(okitjson);
        this.parent_id = data.parent_id;
        // Configure default values
        this.id = 'okit-' + block_storage_volume_prefix + '-' + uuidv4();
        //this.display_name = generateDefaultName(block_storage_volume_prefix, okitjson.block_storage_volumes.length + 1);
        this.display_name = this.generateDefaultName(okitjson.block_storage_volumes.length + 1);
        this.compartment_id = data.parent_id;
        this.availability_domain = '1';
        this.size_in_gbs = 1024;
        this.backup_policy = 'bronze';
        // Update with any passed data
        for (let key in data) {
            this[key] = data[key];
        }
        // Add Get Parent function
        if (parent !== null) {
            this.getParent = function() {return parent};
            this.parent_id = parent.id;
        } else {
            this.getParent = function() {
                for (let parent of okitjson.compartments) {
                    if (parent.id === this.parent_id) {
                        return parent
                    }
                }
                return null;
            }
        }
    }


    /*
    ** Clone Functionality
     */
    clone() {
        return new BlockStorageVolume(this, this.getOkitJson());
    }


    /*
    ** Get the Artifact name this Artifact will be know by.
     */
    getArtifactReference() {
        return block_storage_volume_artifact;
    }


    /*
    ** Delete Processing
     */
    delete() {
        console.groupCollapsed('Delete ' + this.getArtifactReference() + ' : ' + this.id);
        // Delete Child Artifacts
        this.deleteChildren();
        // Remove SVG Element
        d3.select("#" + this.id + "-svg").remove()
        console.groupEnd();
    }

    deleteChildren() {
        // Remove Instance references
        for (let instance of this.getOkitJson().instances) {
            for (let i=0; i < instance.block_storage_volume_ids.length; i++) {
                if (instance.block_storage_volume_ids[i] === this.id) {
                    instance.block_storage_volume_ids.splice(i, 1);
                }
            }
        }
    }


    /*
     ** SVG Processing
     */
    draw() {
        console.groupCollapsed('Drawing ' + this.getArtifactReference() + ' : ' + this.id + ' [' + this.parent_id + ']');
        if (this.isAttached()) {
            console.groupEnd();
            return;
        }
        let svg = drawArtifact(this.getSvgDefinition());
        /*
        ** Add Properties Load Event to created svg. We require the definition of the local variable "me" so that it can
        ** be used in the function dur to the fact that using "this" in the function will refer to the function not the
        ** Artifact.
         */
        let me = this;
        svg.on("click", function() {
            me.loadProperties();
            d3.event.stopPropagation();
        });
        console.groupEnd();
        return svg;
    }

    // Return Artifact Specific Definition.
    getSvgDefinition() {
        console.groupCollapsed('Getting Definition of ' + this.getArtifactReference() + ' : ' + this.id);
        let definition = this.newSVGDefinition(this, this.getArtifactReference());
        let dimensions = this.getDimensions();
        let first_child = this.getParent().getChildOffset(this.getArtifactReference());
        definition['svg']['x'] = first_child.dx;
        definition['svg']['y'] = first_child.dy;
        definition['svg']['width'] = dimensions['width'];
        definition['svg']['height'] = dimensions['height'];
        definition['rect']['stroke']['colour'] = stroke_colours.bark;
        definition['rect']['stroke']['dash'] = 1;
        console.info(JSON.stringify(definition, null, 2));
        console.groupEnd();
        return definition;
    }

    // Return Artifact Dimensions
    getDimensions() {
        console.groupCollapsed('Getting Dimensions of ' + this.getArtifactReference() + ' : ' + this.id);
        let dimensions = this.getMinimumDimensions();
        // Calculate Size based on Child Artifacts
        // Check size against minimum
        dimensions.width  = Math.max(dimensions.width,  this.getMinimumDimensions().width);
        dimensions.height = Math.max(dimensions.height, this.getMinimumDimensions().height);
        console.info('Overall Dimensions       : ' + JSON.stringify(dimensions));
        console.groupEnd();
        return dimensions;
    }

    getMinimumDimensions() {
        return {width: icon_width, height:icon_height};
    }

    isAttached() {
        // Check if this is attached but exclude when parent is the attachment type.
        if (this.getParent().getArtifactReference() !== instance_artifact) {
            for (let instance of this.getOkitJson().instances) {
                if (instance.block_storage_volume_ids.includes(this.id)) {
                    console.info(this.display_name + ' attached to instance ' + instance.display_name);
                    return true;
                }
            }
        }
        return false;
    }


    /*
    ** Property Sheet Load function
     */
    loadProperties() {
        let okitJson = this.getOkitJson();
        let me = this;
        $("#properties").load("propertysheets/block_storage_volume.html", function () {
            // Load Referenced Ids
            // Load Properties
            loadPropertiesSheet(me);
            // Add Event Listeners
            addPropertiesEventListeners(me, []);
        });
    }


    /*
    ** Define Allowable SVG Drop Targets
     */
    getTargets() {
        // Return list of Artifact names
        return [compartment_artifact];
    }

    getNamePrefix() {
        return super.getNamePrefix() + 'bsv';
    }

    /*
    ** Static Functionality
     */
    static getArtifactReference() {
        return 'Block Storage Volume';
    }

    static getDropTargets() {
        return [Compartment.getArtifactReference()];
    }

    static query(request = {}, region='') {
        console.info('------------- Block Storage Volume Query --------------------');
        console.info('------------- Compartment : ' + request.compartment_id);
        $.ajax({
            type: 'get',
            url: 'oci/artifacts/BlockStorageVolume',
            dataType: 'text',
            contentType: 'application/json',
            data: JSON.stringify(request),
            success: function(resp) {
                let response_json = JSON.parse(resp);
                regionOkitJson[region].load({block_storage_volumes: response_json});
                let len =  response_json.length;
                for(let i=0;i<len;i++ ){
                    console.info('Block Storage Volume Query : ' + response_json[i]['display_name']);
                }
                redrawSVGCanvas(region);
                $('#' + block_storage_volume_query_cb).prop('checked', true);
                hideQueryProgressIfComplete();
            },
            error: function(xhr, status, error) {
                console.info('Status : ' + status)
                console.info('Error : ' + error)
                $('#' + block_storage_volume_query_cb).prop('checked', true);
                hideQueryProgressIfComplete();
            }
        });
    }
}

$(document).ready(function() {
    // Setup Search Checkbox
    let body = d3.select('#query-progress-tbody');
    let row = body.append('tr');
    let cell = row.append('td');
    cell.append('input')
        .attr('type', 'checkbox')
        .attr('id', block_storage_volume_query_cb);
    cell.append('label').text(block_storage_volume_artifact);

    // Setup Query Display Form
    body = d3.select('#query-oci-tbody');
    row = body.append('tr');
    cell = row.append('td')
        .text(block_storage_volume_artifact);
    cell = row.append('td');
    let input = cell.append('input')
        .attr('type', 'text')
        .attr('class', 'query-filter')
        .attr('id', 'block_storage_volume_name_filter')
        .attr('name', 'block_storage_volume_name_filter');
});
