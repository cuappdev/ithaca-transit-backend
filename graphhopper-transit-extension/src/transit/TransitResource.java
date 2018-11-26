package transit;

import com.graphhopper.GraphHopper;
import com.graphhopper.json.geo.JsonFeatureCollection;
import com.graphhopper.resources.InfoResource;
import com.graphhopper.util.Constants;
import com.graphhopper.util.shapes.BBox;
import org.glassfish.jersey.server.ManagedAsync;

import javax.ws.rs.*;
import javax.ws.rs.container.AsyncResponse;
import javax.ws.rs.container.Suspended;
import javax.ws.rs.core.MediaType;
import java.util.HashMap;
import java.util.Map;

/**
 * Resource to use and communicate with GraphHopper in a remote application.
 * Must be secure! TODO secure tunnel?
 *
 * Methods:
 * PUT updaterealtimeGTFS
 * PUT updateGTFS
 *
 */
@Path("change")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class TransitResource {
    private final GraphHopper graphhopper;

    TransitResource(GraphHopper app) {
        this.graphhopper = app;
    }

    @POST
    @ManagedAsync
    public void changeGraph(JsonFeatureCollection collection, @Suspended AsyncResponse response) {
        response.resume(graphhopper.changeGraph(collection.getFeatures()));
    }

    public static class Info {
        public static class PerVehicle {
            public boolean elevation;
        }

        public BBox bbox;
        public String[] supported_vehicles;
        public final Map<String, InfoResource.Info.PerVehicle> features = new HashMap<>();
        public String version = Constants.VERSION;
        public String build_date = Constants.BUILD_DATE;
        public String import_date;
        public String data_date;
        public String prepare_ch_date;
        public String prepare_date;
    }
}
