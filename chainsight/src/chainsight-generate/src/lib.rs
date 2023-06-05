use proc_macro::TokenStream;
use quote::quote;
use syn::parse_macro_input;

#[proc_macro]
pub fn manageable(_input: TokenStream) -> TokenStream {
    gen_metric_function()
}

#[proc_macro]
pub fn mapping(input: TokenStream) -> TokenStream {
    let input_type = parse_macro_input!(input as syn::Type);
    gen_publish_function(input_type)
}

#[proc_macro]
pub fn did_export(input: TokenStream) -> TokenStream {
    let item = parse_macro_input!(input as syn::LitStr);
    let file_name = item.value() + ".did";
    TokenStream::from(quote! {
        candid::export_service!();
        #[query(name = "__get_candid_interface_tmp_hack")]
        #[candid_method(query, rename = "__get_candid_interface_tmp_hack")]
        fn __export_did_tmp_() -> String {
            __export_service()
        }
        #[cfg(test)]
        mod tests {
            use super::*;

            #[test]
            fn gen_candid() {
                std::fs::write(#file_name, __export_service()).unwrap();
            }
        }
    })
}

fn gen_publish_function(input_type: syn::Type) -> TokenStream {
    TokenStream::from(quote! {
        use core::publisher;
        use core::subscriber;
        use core::updateable::Updateable;
        struct UpdateableImpl {}
        impl<T> Updateable<T> for UpdateableImpl
        where
            T: IntoIterator<Item = #input_type> + CandidType + Send + Sync + Clone + 'static,
        {
            fn on_update(&self, events: T) {
                events.clone().into_iter().for_each(store::update);
                ic_cdk::spawn(async { publisher::publish(events).await })
            }
        }
        #[update]
        #[candid_method(update)]
        async fn on_update(events: Vec<#input_type>) {
            UpdateableImpl {}.on_update(events);
        }
        #[update]
        #[candid_method(update)]
        fn add_subscriber() {
            publisher::add_subscriber(ic_cdk::caller());
        }

        #[update]
        #[candid_method(update)]
        async fn subscribe(principal: String) {
            subscriber::subscribe(principal).await;
        }
    })
}

fn gen_metric_function() -> TokenStream {
    TokenStream::from(quote! {
    use core::manager;
    use core::manager::Metrics;

        #[query]
        #[candid_method(query)]
        fn metric() -> core::manager::Metrics {
            core::manager::latest()
        }
        #[ic_cdk_macros::init]
        fn init() {
            core::manager::setup()
        }

        #[ic_cdk_macros::post_upgrade]
        fn post_upgrade() {
            core::manager::setup()
        }
        #[query]
        #[candid_method(query)]
        fn metrics(size: usize) -> std::collections::BTreeMap<u64, Metrics> {
            core::manager::metrics(size)
            }
        })
}
